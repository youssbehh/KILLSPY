import { hashSync } from 'bcrypt';
import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';

const VALID_PASSWORD = 'Aa1@strong';

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as jest.Mock).mockReset()),
  );
});

describe('POST /api/auth/signup', () => {
  it('crée un user et renvoie sans le hash de mdp', async () => {
    prismaMock.users.findFirst.mockResolvedValue(null);
    prismaMock.users.create.mockResolvedValue({
      ID_User: 1, Username: 'agent007', Email: 'a@b.io', Password: 'hash',
      MMR: 0, isGuest: false, archived: false, deletionDate: null, CreatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'agent007', email: 'a@b.io', passwordCrea: VALID_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ id: 1, username: 'agent007', email: 'a@b.io' });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.Password).toBeUndefined();
  });

  it('rejette un mot de passe trop faible', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'agent007', email: 'a@b.io', passwordCrea: 'weak' });

    expect(res.status).toBe(400);
    expect(prismaMock.users.create).not.toHaveBeenCalled();
  });

  it('rejette un email invalide', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'agent007', email: 'not-an-email', passwordCrea: VALID_PASSWORD });

    expect(res.status).toBe(400);
  });

  it('renvoie 400 si user existe déjà', async () => {
    prismaMock.users.findFirst.mockResolvedValue({ ID_User: 1 });
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'agent007', email: 'a@b.io', passwordCrea: VALID_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe(1002);
  });
});

describe('POST /api/auth/login', () => {
  const user = (overrides: Partial<any> = {}) => ({
    ID_User: 1,
    Username: 'agent007',
    Email: 'a@b.io',
    Password: hashSync(VALID_PASSWORD, 4),
    MMR: 0,
    isGuest: false,
    archived: false,
    deletionDate: null,
    CreatedAt: new Date(),
    ...overrides,
  });

  it('renvoie un token quand les credentials sont bons', async () => {
    prismaMock.users.findFirst.mockResolvedValue(user());
    prismaMock.session.findFirst.mockResolvedValue(null);
    prismaMock.roles.findFirst.mockResolvedValue(null);
    prismaMock.leaderboard.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'agent007', password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.id).toBe(1);
  });

  it('renvoie 401 pour un mauvais mdp (message générique)', async () => {
    prismaMock.users.findFirst.mockResolvedValue(user());
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'agent007', password: 'WrongPass1@' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Identifiants invalides/);
  });

  it('renvoie 401 pour user inexistant (même message générique)', async () => {
    prismaMock.users.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'nope', password: VALID_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Identifiants invalides/);
  });

  it('renvoie 401 pour user archivé (pas d\'info leak)', async () => {
    prismaMock.users.findFirst.mockResolvedValue(user({ archived: true }));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'agent007', password: VALID_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Identifiants invalides/);
  });

  it('valide les champs requis', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/guest', () => {
  it('crée un compte invité avec un username Guest*', async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);
    prismaMock.users.create.mockResolvedValue({
      ID_User: 42, Username: 'Guest123', Email: 'Guest123@killspy.local', Password: 'hash',
      MMR: 0, isGuest: true, archived: false, deletionDate: null, CreatedAt: new Date(),
    });
    prismaMock.session.create.mockResolvedValue({});

    const res = await request(app).get('/api/auth/guest');

    expect(res.status).toBe(201);
    expect(res.body.user.guest).toBe(true);
    expect(res.body.user.username).toMatch(/^Guest\d+$/);
    expect(res.body.token).toEqual(expect.any(String));
  });
});

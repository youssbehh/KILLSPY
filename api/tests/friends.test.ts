import jwt from 'jsonwebtoken';
import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';
import { JWT_SECRET } from '../src/secrets';

const token = (userId: number) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

const fakeUser = (id = 1) => ({
  ID_User: id,
  Username: `user${id}`,
  Email: `user${id}@b.io`,
  Password: 'hash',
  MMR: 0,
  isGuest: false,
  archived: false,
  deletionDate: null,
  CreatedAt: new Date(),
});

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as jest.Mock).mockReset()),
  );
});

describe('POST /api/friends/add', () => {
  it('refuse sans token', async () => {
    const res = await request(app).post('/api/friends/add').send({ Username: 'someone' });
    expect(res.status).toBe(401);
  });

  it('ajoute un ami quand l\'autre user existe', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.findFirst.mockResolvedValue(fakeUser(2));
    prismaMock.friends.findUnique.mockResolvedValue(null);
    prismaMock.friends.create.mockResolvedValue({ ID_Friendship: 1 });

    const res = await request(app)
      .post('/api/friends/add')
      .set('Authorization', token(1))
      .send({ Username: 'user2' });

    expect(res.status).toBe(201);
    expect(prismaMock.friends.create).toHaveBeenCalledWith({
      data: { ID_User: 1, ID_Friend: 2 },
    });
  });

  it('renvoie 404 si l\'utilisateur cible n\'existe pas', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/friends/add')
      .set('Authorization', token(1))
      .send({ Username: 'ghost' });

    expect(res.status).toBe(404);
  });

  it('renvoie 400 si l\'amitié existe déjà', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.findFirst.mockResolvedValue(fakeUser(2));
    prismaMock.friends.findUnique.mockResolvedValue({ ID_Friendship: 99 });

    const res = await request(app)
      .post('/api/friends/add')
      .set('Authorization', token(1))
      .send({ Username: 'user2' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/friends/getByUser', () => {
  it('renvoie la liste des amis non bloqués', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.friends.findMany.mockResolvedValue([
      { ID_Friendship: 1, ID_User: 1, ID_Friend: 2, Friend: { ID_User: 2, Username: 'user2', MMR: 10 } },
    ]);

    const res = await request(app)
      .get('/api/friends/getByUser')
      .set('Authorization', token(1));

    expect(res.status).toBe(200);
    expect(res.body.record).toHaveLength(1);
    expect(prismaMock.friends.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ID_User: 1, Blocked: false },
    }));
  });
});

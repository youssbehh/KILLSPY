import jwt from 'jsonwebtoken';
import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';
import { JWT_SECRET } from '../src/secrets';

const token = (userId: number) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

const fakeUser = (id = 1, overrides: Partial<any> = {}) => ({
  ID_User: id,
  Username: `user${id}`,
  Email: `user${id}@b.io`,
  Password: 'hash',
  MMR: 0,
  isGuest: false,
  archived: false,
  deletionDate: null,
  CreatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as jest.Mock).mockReset()),
  );
});

describe('PUT /api/users/deleteUser/:id', () => {
  it('refuse de supprimer le compte d\'un autre utilisateur', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));

    const res = await request(app)
      .put('/api/users/deleteUser/2')
      .set('Authorization', token(1));

    expect(res.status).toBe(403);
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });

  it('archive le propre compte de l\'utilisateur', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.update.mockResolvedValue(fakeUser(1, { archived: true }));

    const res = await request(app)
      .put('/api/users/deleteUser/1')
      .set('Authorization', token(1));

    expect(res.status).toBe(200);
    expect(prismaMock.users.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { ID_User: 1 },
      data: expect.objectContaining({ archived: true }),
    }));
  });
});

describe('POST /api/users/update-username', () => {
  it('refuse pour un compte guest', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1, { isGuest: true }));

    const res = await request(app)
      .post('/api/users/update-username')
      .set('Authorization', token(1))
      .send({ newUsername: 'NewName' });

    expect(res.status).toBe(403);
  });

  it('refuse si pseudo déjà pris', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser(1))
      .mockResolvedValueOnce(fakeUser(2, { Username: 'TakenName' }));

    const res = await request(app)
      .post('/api/users/update-username')
      .set('Authorization', token(1))
      .send({ newUsername: 'TakenName' });

    expect(res.status).toBe(400);
  });

  it('met à jour le pseudo si disponible', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser(1))
      .mockResolvedValueOnce(null);
    prismaMock.users.update.mockResolvedValue(fakeUser(1, { Username: 'NewName' }));

    const res = await request(app)
      .post('/api/users/update-username')
      .set('Authorization', token(1))
      .send({ newUsername: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('NewName');
  });
});

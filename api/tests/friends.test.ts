import jwt from 'jsonwebtoken';
import { createPrismaMock, PrismaMock, resetPrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';
import { JWT_SECRET } from '../src/secrets';

const token = (userId: number) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

const fakeUser = (id = 1, overrides: Record<string, unknown> = {}) => ({
  ID_User: id,
  Username: `user${id}`,
  Email: `user${id}@b.io`,
  Password: 'hash',
  MMR: 0,
  Money: 0,
  XP: 0,
  isGuest: false,
  archived: false,
  banned: false,
  emailVerified: false,
  tokenVersion: 0,
  deletionDate: null,
  CreatedAt: new Date(),
  ...overrides,
});

beforeEach(() => resetPrismaMock(prismaMock));

describe('friend requests', () => {
  it('refuse sans token', async () => {
    const res = await request(app).post('/api/friends/request').send({ username: 'someone' });
    expect(res.status).toBe(401);
  });

  it('refuse un invité', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1, { isGuest: true }));
    const res = await request(app).post('/api/friends/request').set('Authorization', token(1)).send({ username: 'user2' });
    expect(res.status).toBe(403);
  });

  it('crée une demande en attente', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.findFirst.mockResolvedValue({ ID_User: 2, Username: 'user2', MMR: 0 });
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.friends.findFirst.mockResolvedValue(null);
    prismaMock.friends.create.mockResolvedValue({});

    const res = await request(app).post('/api/friends/request').set('Authorization', token(1)).send({ username: 'user2' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(prismaMock.friends.create).toHaveBeenCalledWith({ data: { ID_User: 1, ID_Friend: 2, Status: 'pending' } });
  });

  it("accepte directement si l'autre avait déjà demandé", async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.findFirst.mockResolvedValue({ ID_User: 2, Username: 'user2', MMR: 0 });
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.friends.findFirst.mockResolvedValue({ ID_Friendship: 9, ID_User: 2, ID_Friend: 1, Status: 'pending' });
    prismaMock.friends.update.mockResolvedValue({});

    const res = await request(app).post('/api/friends/add').set('Authorization', token(1)).send({ Username: 'user2' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('accepted');
    expect(prismaMock.friends.create).not.toHaveBeenCalled();
  });

  it('un joueur qui vous a bloqué est introuvable', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.users.findFirst.mockResolvedValue({ ID_User: 2, Username: 'user2', MMR: 0 });
    prismaMock.block.findFirst.mockResolvedValue({ id: 1, blockerId: 2, blockedId: 1 });

    const res = await request(app).post('/api/friends/request').set('Authorization', token(1)).send({ username: 'user2' });

    expect(res.status).toBe(404);
  });
});

describe('admin routes', () => {
  it("refuse un joueur sans le rôle admin", async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser(1));
    prismaMock.roles.findFirst.mockResolvedValue(null);
    const res = await request(app).get('/api/admin/reports').set('Authorization', token(1));
    expect(res.status).toBe(403);
  });
});

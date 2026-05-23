import jwt from 'jsonwebtoken';
import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
(prismaMock as any).gameHistory = {
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
};
(prismaMock as any).$transaction = jest.fn(async (ops: any[]) => Promise.all(ops));

jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';
import { JWT_SECRET } from '../src/secrets';

const token = (userId: number) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });

const fakeUser = (overrides: any = {}) => ({
  ID_User: 1,
  Username: 'agent007',
  Email: 'a@b.io',
  Password: 'hash',
  MMR: 100,
  isGuest: false,
  archived: false,
  deletionDate: null,
  CreatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    typeof model === 'object'
      ? Object.values(model).forEach((fn) => (fn as jest.Mock)?.mockReset?.())
      : undefined,
  );
});

describe('POST /api/games/result', () => {
  it('rejects without token', async () => {
    const res = await request(app).post('/api/games/result').send({ outcome: 'won', mode: 'pvp_quick' });
    expect(res.status).toBe(401);
  });

  it('validates outcome enum', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'wat', mode: 'pvp_quick' });
    expect(res.status).toBe(400);
  });

  it('PvE is NOT persisted (null result, no gameHistory.create)', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 100 }));

    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pve' });

    expect(res.status).toBe(201);
    expect(res.body.result).toBeNull();
    expect((prismaMock as any).gameHistory.create).not.toHaveBeenCalled();
  });

  it('records a PvP Quick win but does NOT change MMR', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 100 }));
    (prismaMock as any).gameHistory.create.mockResolvedValue({ ID_GameHistory: 43 });
    prismaMock.leaderboard.upsert.mockResolvedValue({});

    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pvp_quick' });

    expect(res.status).toBe(201);
    expect(res.body.result.mmrAfter).toBe(100);
    expect(res.body.result.delta).toBe(0);
    expect((prismaMock as any).gameHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ Mode: 'pvp_quick' }) }),
    );
  });

  it('PvP Ranked win increases MMR', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 100 }));
    (prismaMock as any).gameHistory.create.mockResolvedValue({ ID_GameHistory: 44 });
    prismaMock.leaderboard.upsert.mockResolvedValue({});

    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pvp_ranked' });

    expect(res.status).toBe(201);
    expect(res.body.result.mmrAfter).toBeGreaterThan(100);
    expect(res.body.result.delta).toBeGreaterThan(0);
    expect((prismaMock as any).gameHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ Mode: 'pvp_ranked' }) }),
    );
  });

  it('PvP Ranked loss decreases MMR but floors at 0', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 5 }));
    (prismaMock as any).gameHistory.create.mockResolvedValue({ ID_GameHistory: 45 });
    prismaMock.leaderboard.upsert.mockResolvedValue({});

    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'lost', mode: 'pvp_ranked' });

    expect(res.status).toBe(201);
    expect(res.body.result.mmrAfter).toBe(0);
  });

  it('guests get a null result (no persistence)', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ isGuest: true }));

    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pvp_quick' });

    expect(res.status).toBe(201);
    expect(res.body.result).toBeNull();
    expect((prismaMock as any).gameHistory.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/games/me/stats', () => {
  it('returns aggregated stats split by mode', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser()) // authMiddleware lookup
      .mockResolvedValueOnce(fakeUser()); // service lookup
    (prismaMock as any).gameHistory.count
      .mockResolvedValueOnce(5) // quick wins
      .mockResolvedValueOnce(3) // quick losses
      .mockResolvedValueOnce(2) // ranked wins
      .mockResolvedValueOnce(1); // ranked losses
    (prismaMock as any).gameHistory.findMany.mockResolvedValue([
      { ID_GameHistory: 1, V_D: true, DateGame: new Date(), MMRWin: 25, Mode: 'pvp_ranked' },
      { ID_GameHistory: 2, V_D: false, DateGame: new Date(), MMRWin: 0, Mode: 'pvp_quick' },
    ]);

    const res = await request(app).get('/api/games/me/stats').set('Authorization', token(1));

    expect(res.status).toBe(200);
    expect(res.body.stats.quick).toEqual({ wins: 5, losses: 3, total: 8, winRate: 5 / 8 });
    expect(res.body.stats.ranked).toEqual({ wins: 2, losses: 1, total: 3, winRate: 2 / 3 });
    expect(res.body.recentGames).toHaveLength(2);
    expect(res.body.recentGames[0].mode).toBe('pvp_ranked');
  });
});

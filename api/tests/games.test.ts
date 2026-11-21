import jwt from 'jsonwebtoken';
import { createPrismaMock, PrismaMock, resetPrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import { app } from '../src/app';
import { JWT_SECRET } from '../src/secrets';
import { recordGame } from '../src/services/games.service';

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
  XP: 0,
  emailVerified: false,
  banned: false,
  tokenVersion: 0,
  CreatedAt: new Date(),
  ...overrides,
});

beforeEach(() => resetPrismaMock(prismaMock));

describe('POST /api/games/result', () => {
  it('rejects without token', async () => {
    const res = await request(app).post('/api/games/result').send({ outcome: 'won', mode: 'pve' });
    expect(res.status).toBe(401);
  });

  it('validates outcome enum', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'wat', mode: 'pve' });
    expect(res.status).toBe(400);
  });

  it('PvE is recorded as history only: no MMR, coins or XP', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 100, Money: 10 }));
    prismaMock.gameHistory.create.mockResolvedValue({ ID_GameHistory: 42 });

    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pve', rounds: 6 });

    expect(res.status).toBe(201);
    expect(res.body.result).toMatchObject({ delta: 0, moneyDelta: 0, xpDelta: 0 });
    expect(prismaMock.gameHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ Mode: 'pve', Rounds: 6, MMRWin: 0, XPWin: 0 }) }),
    );
  });

  it.each(['pvp_quick', 'pvp_ranked'])('rejects a client-declared %s result', async (mode) => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode });
    expect(res.status).toBe(400);
    expect(prismaMock.gameHistory.create).not.toHaveBeenCalled();
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });

  it('accepts a Bearer-prefixed token', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());
    prismaMock.gameHistory.create.mockResolvedValue({ ID_GameHistory: 1 });
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', `Bearer ${token(1)}`)
      .send({ outcome: 'won', mode: 'pve' });
    expect(res.status).toBe(201);
  });

  it('rejects a token revoked by a tokenVersion bump', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ tokenVersion: 3 }));
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pve' });
    expect(res.status).toBe(401);
  });

  it('rejects a banned account', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ banned: true }));
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pve' });
    expect(res.status).toBe(401);
  });

  it('rejects an archived account', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ archived: true }));
    const res = await request(app)
      .post('/api/games/result')
      .set('Authorization', token(1))
      .send({ outcome: 'won', mode: 'pve' });
    expect(res.status).toBe(401);
  });
});

describe('recordGame (server-side, called by the socket game room)', () => {
  it('records a PvP Quick win without changing MMR', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 100, Money: 10 }));
    prismaMock.gameHistory.create.mockResolvedValue({ ID_GameHistory: 43 });

    const result = await recordGame({ userId: 1, outcome: 'won', mode: 'pvp_quick' });

    expect(result?.mmrAfter).toBe(100);
    expect(result?.delta).toBe(0);
    expect(result?.moneyDelta).toBe(20);
    expect(result?.xpDelta).toBe(50);
    expect(prismaMock.users.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { MMR: 100, Money: { increment: 20 }, XP: { increment: 50 } } }),
    );
    expect(prismaMock.gameHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ Mode: 'pvp_quick' }) }),
    );
  });

  it('PvP Ranked win increases MMR', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 100 }));
    prismaMock.gameHistory.create.mockResolvedValue({ ID_GameHistory: 44 });

    const result = await recordGame({ userId: 1, outcome: 'won', mode: 'pvp_ranked' });

    expect(result?.mmrAfter).toBeGreaterThan(100);
    expect(result?.delta).toBeGreaterThan(0);
  });

  it('PvP Ranked loss decreases MMR but floors at 0', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ MMR: 5 }));
    prismaMock.gameHistory.create.mockResolvedValue({ ID_GameHistory: 45 });

    const result = await recordGame({ userId: 1, outcome: 'lost', mode: 'pvp_ranked' });

    expect(result?.mmrAfter).toBe(0);
  });

  it('friendly duels are never persisted', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser());

    const result = await recordGame({ userId: 1, outcome: 'won', mode: 'pvp_friendly' });

    expect(result).toBeNull();
    expect(prismaMock.gameHistory.create).not.toHaveBeenCalled();
  });

  it('guests are never persisted', async () => {
    prismaMock.users.findUnique.mockResolvedValue(fakeUser({ isGuest: true }));

    const result = await recordGame({ userId: 1, outcome: 'won', mode: 'pvp_quick' });

    expect(result).toBeNull();
    expect(prismaMock.gameHistory.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/games/me/stats', () => {
  it('returns aggregated stats split by mode', async () => {
    prismaMock.users.findUnique
      .mockResolvedValueOnce(fakeUser()) // authMiddleware lookup
      .mockResolvedValueOnce(fakeUser()); // service lookup
    prismaMock.gameHistory.count
      .mockResolvedValueOnce(5) // quick wins
      .mockResolvedValueOnce(1) // quick draws
      .mockResolvedValueOnce(9) // quick total
      .mockResolvedValueOnce(2) // ranked wins
      .mockResolvedValueOnce(0) // ranked draws
      .mockResolvedValueOnce(3); // ranked total
    prismaMock.gameHistory.findMany.mockResolvedValue([
      { ID_GameHistory: 1, V_D: true, Draw: false, Rounds: 5, DateGame: new Date(), MMRWin: 25, XPWin: 75, Mode: 'pvp_ranked', OpponentId: 7 },
      { ID_GameHistory: 2, V_D: false, Draw: true, Rounds: 8, DateGame: new Date(), MMRWin: 0, XPWin: 25, Mode: 'pvp_quick', OpponentId: null },
    ]);
    prismaMock.users.findMany.mockResolvedValue([{ ID_User: 7, Username: 'rival' }]);

    const res = await request(app).get('/api/games/me/stats').set('Authorization', token(1));

    expect(res.status).toBe(200);
    expect(res.body.stats.quick).toEqual({ wins: 5, draws: 1, losses: 3, total: 9, winRate: 5 / 9 });
    expect(res.body.stats.ranked).toEqual({ wins: 2, draws: 0, losses: 1, total: 3, winRate: 2 / 3 });
    expect(res.body.recentGames).toHaveLength(2);
    expect(res.body.recentGames[0]).toMatchObject({ mode: 'pvp_ranked', opponent: 'rival', rounds: 5 });
    expect(res.body.recentGames[1]).toMatchObject({ draw: true, won: false, opponent: null });
  });
});

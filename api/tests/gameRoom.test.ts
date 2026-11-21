import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

const recordGame = jest.fn().mockResolvedValue(null);
jest.mock('../src/services/games.service', () => ({ recordGame: (...args: unknown[]) => recordGame(...args) }));

import {
  RECONNECT_GRACE_MS,
  createRoom,
  handleAction,
  handleDisconnect,
  handleLeave,
  tryResume,
  __test as roomTest,
} from '../src/sockets/gameRoom';
import { joinQueue, leaveQueue, pickRankedPair, rankedWindow, __test as queueTest } from '../src/sockets/matchmaking';
import { COUNTDOWN_DURATION_MS, TURN_DURATION_MS } from '../src/game/gameEngine';

type Emitted = { event: string; payload: any };

const makeSocket = (id: string, userId: number, isGuest = false, mmr = 0) => {
  const emitted: Emitted[] = [];
  return {
    id,
    data: { user: { id: userId, username: `agent${userId}`, isGuest, mmr } },
    emitted,
    emit: (event: string, payload: unknown) => emitted.push({ event, payload }),
    join: jest.fn(),
    leave: jest.fn(),
  };
};

const makeIo = (sockets: ReturnType<typeof makeSocket>[]) => {
  const byId = new Map(sockets.map((s) => [s.id, s]));
  return {
    sockets: { sockets: byId },
    to: (target: string) => ({
      emit: (event: string, payload: unknown) => {
        const direct = byId.get(target);
        // Room broadcast → every socket of the test; direct emit → that socket only.
        (direct ? [direct] : sockets).forEach((s) => s.emitted.push({ event, payload }));
      },
    }),
  };
};

const last = (s: ReturnType<typeof makeSocket>, event: string) =>
  [...s.emitted].reverse().find((e) => e.event === event)?.payload;

const setup = (mode: 'pvp_quick' | 'pvp_ranked' = 'pvp_quick') => {
  const a = makeSocket('sa', 1);
  const b = makeSocket('sb', 2);
  const io = makeIo([a, b]);
  createRoom(io as any, a as any, b as any, mode);
  return { a, b, io: io as any };
};

beforeEach(() => {
  jest.useFakeTimers();
  recordGame.mockClear();
  roomTest.rooms.clear();
  roomTest.socketToRoom.clear();
  queueTest.reset();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('game room', () => {
  it('ignores actions sent during the countdown', () => {
    const { a, b, io } = setup();
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');
    expect(last(a, 'state:update').state.round).toBe(0);
  });

  it('resolves a turn once both players have acted', () => {
    const { a, b, io } = setup();
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');
    const state = last(a, 'state:update').state;
    expect(state.round).toBe(1);
    expect(state.player.ammo).toBe(1);
    expect(state.opponent.ammo).toBe(1);
  });

  it('cannot resolve a turn alone with a stale opponent action', () => {
    const { a, b, io } = setup();
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');

    // Reveal pause: player A fires repeatedly while B's previous action is stale.
    handleAction(io, a as any, 'shoot');
    handleAction(io, a as any, 'shoot');
    expect(last(a, 'state:update').state.round).toBe(1);
    expect(last(a, 'state:update').state.opponent.lives).toBe(3);
  });

  it('rejects unknown actions', () => {
    const { a, io } = setup();
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'nuke');
    expect(last(a, 'error:message')).toBe('Action inconnue.');
  });

  it('forces an action for an AFK player at the deadline', () => {
    const { a, io } = setup();
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    jest.advanceTimersByTime(TURN_DURATION_MS);
    expect(last(a, 'state:update').state.round).toBe(1);
  });

  it('cancels a match forfeited before any turn: no record, no reward', () => {
    const { a, b, io } = setup();
    handleLeave(io, a as any);
    expect(last(b, 'game:over')).toMatchObject({
      outcome: 'opponent_forfeit',
      rewards: { mmrDelta: 0, moneyDelta: 0 },
    });
    expect(recordGame).not.toHaveBeenCalled();
    expect(roomTest.rooms.size).toBe(0);
  });

  it('records a forfeit after the first turn with the room mode, and leaves no timer behind', () => {
    const { a, b, io } = setup('pvp_ranked');
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');
    handleLeave(io, a as any);

    expect(last(b, 'game:over')).toMatchObject({ outcome: 'opponent_forfeit', mode: 'pvp_ranked' });
    expect(last(b, 'game:over').rewards.mmrDelta).toBeGreaterThan(0);
    expect(recordGame).toHaveBeenCalledWith({ userId: 1, outcome: 'lost', mode: 'pvp_ranked', rounds: 1, opponentId: 2 });
    expect(recordGame).toHaveBeenCalledWith({ userId: 2, outcome: 'won', mode: 'pvp_ranked', rounds: 1, opponentId: 1 });
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('reconnection', () => {
  it('keeps the match alive during the grace period and lets the player resume', () => {
    const { a, b, io } = setup();
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');

    handleDisconnect(io, a as any);
    expect(last(b, 'opponent:status')).toEqual({ connected: false, graceMs: RECONNECT_GRACE_MS });
    expect(last(b, 'game:over')).toBeUndefined();
    expect(roomTest.rooms.size).toBe(1);

    // Same player, new socket.
    const a2 = makeSocket('sa2', 1);
    (io.sockets.sockets as Map<string, unknown>).set('sa2', a2);
    expect(tryResume(io, a2 as any)).toBe(true);
    expect(last(a2, 'match:resume')).toMatchObject({ mode: 'pvp_quick', opponent: { id: 2 } });
    expect(last(a2, 'match:resume').state.round).toBe(1);
    expect(last(b, 'opponent:status')).toEqual({ connected: true });

    // The grace timer is gone: nobody forfeits later.
    jest.advanceTimersByTime(RECONNECT_GRACE_MS + 1000);
    expect(last(b, 'game:over')?.outcome).not.toBe('opponent_forfeit');
  });

  it('forfeits the match when the grace period runs out', () => {
    const { a, b, io } = setup();
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');

    handleDisconnect(io, a as any);
    jest.advanceTimersByTime(RECONNECT_GRACE_MS);

    // The match may also have ended on the board while A was away; either way it is over.
    expect(last(b, 'game:over')).toBeDefined();
    expect(roomTest.rooms.size).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not hijack a match the player still holds on another device', () => {
    const { io } = setup();
    const other = makeSocket('sa-other', 1);
    expect(tryResume(io, other as any)).toBe(false);
  });

  it('ends at once when both players are gone', () => {
    const { a, b, io } = setup();
    handleDisconnect(io, a as any);
    handleDisconnect(io, b as any);
    expect(roomTest.rooms.size).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('friendly duels', () => {
  it('give no reward', () => {
    const a = makeSocket('sa', 1);
    const b = makeSocket('sb', 2);
    const io = makeIo([a, b]) as any;
    createRoom(io, a as any, b as any, 'pvp_friendly');
    jest.advanceTimersByTime(COUNTDOWN_DURATION_MS);
    handleAction(io, a as any, 'reload');
    handleAction(io, b as any, 'reload');
    handleLeave(io, a as any);
    expect(last(b, 'game:over')).toMatchObject({
      mode: 'pvp_friendly',
      rewards: { mmrDelta: 0, moneyDelta: 0, xpDelta: 0 },
    });
  });
});

describe('ranked matchmaking window', () => {
  const entry = (mmr: number, since: number) => ({ socket: {} as any, mmr, since });

  it('widens with waiting time', () => {
    expect(rankedWindow(0)).toBe(100);
    expect(rankedWindow(10_000)).toBe(500);
  });

  it('pairs the closest ratings first', () => {
    const now = 1_000_000;
    const pair = pickRankedPair([entry(100, now), entry(900, now), entry(150, now)], now);
    expect(pair?.map((e) => e.mmr).sort((x, y) => x - y)).toEqual([100, 150]);
  });

  it('keeps distant players apart until one has waited long enough', () => {
    const now = 1_000_000;
    expect(pickRankedPair([entry(0, now), entry(600, now)], now)).toBeNull();
    expect(pickRankedPair([entry(0, now - 15_000), entry(600, now)], now)).not.toBeNull();
  });

  it('does not match two ranked players who are too far apart on join', () => {
    const a = makeSocket('sa', 1, false, 0);
    const b = makeSocket('sb', 2, false, 1500);
    const io = makeIo([a, b]) as any;
    joinQueue(io, a as any, 'pvp_ranked');
    joinQueue(io, b as any, 'pvp_ranked');
    expect(roomTest.rooms.size).toBe(0);
    expect(queueTest.queues.pvp_ranked).toHaveLength(2);
  });
});

describe('matchmaking', () => {
  it('pairs two players of the same mode only', () => {
    const a = makeSocket('sa', 1);
    const b = makeSocket('sb', 2);
    const c = makeSocket('sc', 3);
    const io = makeIo([a, b, c]) as any;

    joinQueue(io, a as any, 'pvp_quick');
    joinQueue(io, b as any, 'pvp_ranked');
    expect(roomTest.rooms.size).toBe(0);

    joinQueue(io, c as any, 'pvp_ranked');
    expect(roomTest.rooms.size).toBe(1);
    expect(last(b, 'match:found').mode).toBe('pvp_ranked');
    expect(queueTest.queues.pvp_quick).toHaveLength(1);
  });

  it('refuses ranked for guests and re-queueing while in a match', () => {
    const guest = makeSocket('sg', 9, true);
    const a = makeSocket('sa', 1);
    const b = makeSocket('sb', 2);
    const io = makeIo([guest, a, b]) as any;

    joinQueue(io, guest as any, 'pvp_ranked');
    expect(queueTest.queues.pvp_ranked).toHaveLength(0);

    joinQueue(io, a as any);
    joinQueue(io, b as any);
    joinQueue(io, a as any);
    expect(last(a, 'error:message')).toBe('Vous êtes déjà en partie.');
    expect(queueTest.queues.pvp_quick).toHaveLength(0);
  });

  it('leaveQueue removes the socket', () => {
    const a = makeSocket('sa', 1);
    const io = makeIo([a]) as any;
    joinQueue(io, a as any);
    leaveQueue(io, a as any);
    expect(queueTest.queues.pvp_quick).toHaveLength(0);
    expect(last(a, 'matchmaking:status').status).toBe('cancelled');
  });
});

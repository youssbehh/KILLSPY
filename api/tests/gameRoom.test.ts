import { createPrismaMock, PrismaMock } from './__mocks__/prismaMock';

const prismaMock: PrismaMock = createPrismaMock();
jest.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

const recordGame = jest.fn().mockResolvedValue(null);
jest.mock('../src/services/games.service', () => ({ recordGame: (...args: unknown[]) => recordGame(...args) }));

import { createRoom, handleAction, handleLeaveOrDisconnect, __test as roomTest } from '../src/sockets/gameRoom';
import { joinQueue, leaveQueue, __test as queueTest } from '../src/sockets/matchmaking';
import { COUNTDOWN_DURATION_MS, TURN_DURATION_MS } from '../src/game/gameEngine';

type Emitted = { event: string; payload: any };

const makeSocket = (id: string, userId: number, isGuest = false) => {
  const emitted: Emitted[] = [];
  return {
    id,
    data: { user: { id: userId, username: `agent${userId}`, isGuest } },
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
  queueTest.queues.pvp_quick.length = 0;
  queueTest.queues.pvp_ranked.length = 0;
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
    handleLeaveOrDisconnect(io, a as any);
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
    handleLeaveOrDisconnect(io, a as any);

    expect(last(b, 'game:over')).toMatchObject({ outcome: 'opponent_forfeit', mode: 'pvp_ranked' });
    expect(last(b, 'game:over').rewards.mmrDelta).toBeGreaterThan(0);
    expect(recordGame).toHaveBeenCalledWith({ userId: 1, outcome: 'lost', mode: 'pvp_ranked' });
    expect(recordGame).toHaveBeenCalledWith({ userId: 2, outcome: 'won', mode: 'pvp_ranked' });
    expect(jest.getTimerCount()).toBe(0);
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

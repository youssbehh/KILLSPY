import { useGameStore } from './gameStore';
import { createInitialState } from '../game/gameEngine';

const store = () => useGameStore.getState();

beforeEach(() => store().reset());

describe('gameStore — PvP match flow', () => {
  it('starts idle', () => {
    expect(store().matchStatus).toBe('idle');
  });

  it('searching keeps the requested mode and queue size', () => {
    store().setSearching('pvp_ranked', 3);
    expect(store()).toMatchObject({ matchStatus: 'searching', mode: 'pvp_ranked', queueSize: 3 });
  });

  it('stays in countdown when the initial state arrives after match:found', () => {
    store().setMatchFound('room', { id: 2, username: 'rival' }, 3000, 'pvp_quick');
    store().setStateUpdate(createInitialState());
    expect(store().matchStatus).toBe('countdown');
    expect(store().opponent?.username).toBe('rival');
  });

  it('turn:start opens the turn and clears the previous selection', () => {
    store().setMatchFound('room', { id: 2, username: 'rival' }, 3000, 'pvp_quick');
    store().setSelectedAction('reload');
    store().setTurnStart(1, Date.now() + 5000);
    expect(store()).toMatchObject({ matchStatus: 'playing', round: 1, selectedAction: null });
  });

  it('a resolved turn switches to the reveal phase without a deadline', () => {
    store().setTurnStart(1, Date.now() + 5000);
    store().setStateUpdate({ ...createInitialState(), round: 1 });
    expect(store()).toMatchObject({ matchStatus: 'resolving', deadlineAt: null });
  });

  it('game:over stores the outcome and the server rewards', () => {
    const finalState = { ...createInitialState(), round: 4, status: 'won' as const };
    store().setOutcome('won', finalState, { mmrDelta: 25, moneyDelta: 50, xpDelta: 75 }, 'pvp_ranked');
    expect(store()).toMatchObject({
      matchStatus: 'finished',
      outcome: 'won',
      mode: 'pvp_ranked',
      rewards: { mmrDelta: 25, moneyDelta: 50, xpDelta: 75 },
    });
  });

  it('resuming mid-turn puts the player straight back into the turn', () => {
    const state = { ...createInitialState(), round: 3 };
    store().setResumed({ roomId: 'r', mode: 'pvp_ranked', opponent: { id: 2, username: 'rival' }, state, turnRemainingMs: 2500 });
    expect(store()).toMatchObject({ matchStatus: 'playing', mode: 'pvp_ranked', round: 4 });
    expect(store().deadlineAt).toBeGreaterThan(Date.now());
  });

  it('resuming between two turns waits for the next one', () => {
    const state = { ...createInitialState(), round: 3 };
    store().setResumed({ roomId: 'r', mode: 'pvp_quick', opponent: { id: 2, username: 'rival' }, state, turnRemainingMs: null });
    expect(store()).toMatchObject({ matchStatus: 'resolving', deadlineAt: null });
  });

  it('tracks an opponent who dropped and came back', () => {
    store().setOpponentStatus(false, 20000);
    expect(store().opponentGraceUntil).toBeGreaterThan(Date.now());
    store().setOpponentStatus(true);
    expect(store().opponentGraceUntil).toBeNull();
  });

  it('searching again after a match wipes the previous result (rematch)', () => {
    store().setOutcome('lost', createInitialState(), { mmrDelta: 0, moneyDelta: 5, xpDelta: 15 }, 'pvp_quick');
    store().setSearching('pvp_quick');
    expect(store()).toMatchObject({ matchStatus: 'searching', outcome: null, rewards: null });
  });
});

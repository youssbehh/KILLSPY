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
    store().setOutcome('won', finalState, { mmrDelta: 25, moneyDelta: 50 }, 'pvp_ranked');
    expect(store()).toMatchObject({
      matchStatus: 'finished',
      outcome: 'won',
      mode: 'pvp_ranked',
      rewards: { mmrDelta: 25, moneyDelta: 50 },
    });
  });

  it('searching again after a match wipes the previous result (rematch)', () => {
    store().setOutcome('lost', createInitialState(), { mmrDelta: 0, moneyDelta: 5 }, 'pvp_quick');
    store().setSearching('pvp_quick');
    expect(store()).toMatchObject({ matchStatus: 'searching', outcome: null, rewards: null });
  });
});

import {
  createInitialState,
  resolveTurn,
  isActionLegal,
  forcedAction,
  flipPerspective,
  INITIAL_LIVES,
  MAX_AMMO,
} from './gameEngine';

describe('createInitialState', () => {
  it('returns 3 lives and 0 ammo for both', () => {
    const s = createInitialState();
    expect(s.player.lives).toBe(INITIAL_LIVES);
    expect(s.opponent.lives).toBe(INITIAL_LIVES);
    expect(s.player.ammo).toBe(0);
    expect(s.opponent.ammo).toBe(0);
    expect(s.status).toBe('choosing');
  });
});

describe('isActionLegal', () => {
  it('forbids shoot with 0 ammo', () => {
    expect(isActionLegal({ lives: 3, ammo: 0 }, 'shoot')).toBe(false);
  });
  it('allows shoot with 1+ ammo', () => {
    expect(isActionLegal({ lives: 3, ammo: 1 }, 'shoot')).toBe(true);
  });
  it('forbids reload at max ammo', () => {
    expect(isActionLegal({ lives: 3, ammo: MAX_AMMO }, 'reload')).toBe(false);
  });
  it('always allows shield', () => {
    expect(isActionLegal({ lives: 3, ammo: 0 }, 'shield')).toBe(true);
    expect(isActionLegal({ lives: 3, ammo: MAX_AMMO }, 'shield')).toBe(true);
  });
});

describe('forcedAction', () => {
  it('forces reload when no ammo', () => {
    expect(forcedAction({ lives: 3, ammo: 0 })).toBe('reload');
  });
  it('forces shield when ammo available', () => {
    expect(forcedAction({ lives: 3, ammo: 2 })).toBe('shield');
  });
});

describe('resolveTurn', () => {
  it('player shoots opponent reloading → opponent loses 1 life', () => {
    const state = { ...createInitialState(), player: { lives: 3, ammo: 1 } };
    const s = resolveTurn(state, 'shoot', 'reload');
    expect(s.opponent.lives).toBe(2);
    expect(s.player.ammo).toBe(0);
  });

  it('opponent shoots player shielding → player keeps all lives', () => {
    const state = {
      ...createInitialState(),
      opponent: { lives: 3, ammo: 1 },
    };
    const s = resolveTurn(state, 'shield', 'shoot');
    expect(s.player.lives).toBe(3);
  });

  it('both shoot with 1 life each → draw', () => {
    const state = {
      ...createInitialState(),
      player: { lives: 1, ammo: 1 },
      opponent: { lives: 1, ammo: 1 },
    };
    const s = resolveTurn(state, 'shoot', 'shoot');
    expect(s.status).toBe('draw');
  });
});

describe('flipPerspective', () => {
  it('swaps player/opponent and inverts won↔lost', () => {
    const s = {
      ...createInitialState(),
      player: { lives: 2, ammo: 1 },
      opponent: { lives: 3, ammo: 0 },
      status: 'won' as const,
    };
    const flipped = flipPerspective(s);
    expect(flipped.player.lives).toBe(3);
    expect(flipped.status).toBe('lost');
  });
});

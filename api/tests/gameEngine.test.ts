import {
  createInitialState,
  resolveTurn,
  isActionLegal,
  forcedAction,
  flipPerspective,
  INITIAL_LIVES,
  MAX_AMMO,
} from '../src/game/gameEngine';

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
  it('both reload → both ammo +1, no damage', () => {
    const s = resolveTurn(createInitialState(), 'reload', 'reload');
    expect(s.player.ammo).toBe(1);
    expect(s.opponent.ammo).toBe(1);
    expect(s.player.lives).toBe(3);
    expect(s.opponent.lives).toBe(3);
    expect(s.status).toBe('choosing');
  });

  it('player shoots opponent reloading → opponent loses 1 life', () => {
    const state = { ...createInitialState(), player: { lives: 3, ammo: 1 } };
    const s = resolveTurn(state, 'shoot', 'reload');
    expect(s.opponent.lives).toBe(2);
    expect(s.player.ammo).toBe(0);
    expect(s.opponent.ammo).toBe(1);
  });

  it('opponent shoots player shielding → player keeps all lives', () => {
    const state = {
      ...createInitialState(),
      opponent: { lives: 3, ammo: 1 },
    };
    const s = resolveTurn(state, 'shield', 'shoot');
    expect(s.player.lives).toBe(3);
    expect(s.opponent.ammo).toBe(0);
  });

  it('both shoot with 1 life each → draw', () => {
    const state = {
      ...createInitialState(),
      player: { lives: 1, ammo: 1 },
      opponent: { lives: 1, ammo: 1 },
    };
    const s = resolveTurn(state, 'shoot', 'shoot');
    expect(s.player.lives).toBe(0);
    expect(s.opponent.lives).toBe(0);
    expect(s.status).toBe('draw');
  });

  it('player kills opponent → won', () => {
    const state = {
      ...createInitialState(),
      player: { lives: 3, ammo: 1 },
      opponent: { lives: 1, ammo: 0 },
    };
    const s = resolveTurn(state, 'shoot', 'reload');
    expect(s.opponent.lives).toBe(0);
    expect(s.status).toBe('won');
  });

  it('opponent kills player → lost', () => {
    const state = {
      ...createInitialState(),
      player: { lives: 1, ammo: 0 },
      opponent: { lives: 3, ammo: 1 },
    };
    const s = resolveTurn(state, 'reload', 'shoot');
    expect(s.player.lives).toBe(0);
    expect(s.status).toBe('lost');
  });

  it('shoot with 0 ammo does no damage even if target unprotected', () => {
    const state = createInitialState();
    const s = resolveTurn(state, 'shoot', 'reload');
    expect(s.opponent.lives).toBe(3);
  });

  it('reload caps at MAX_AMMO', () => {
    const state = {
      ...createInitialState(),
      player: { lives: 3, ammo: MAX_AMMO },
    };
    const s = resolveTurn(state, 'reload', 'reload');
    expect(s.player.ammo).toBe(MAX_AMMO);
  });

  it('does nothing when status is not "choosing"', () => {
    const finished = { ...createInitialState(), status: 'won' as const };
    const s = resolveTurn(finished, 'reload', 'reload');
    expect(s).toBe(finished);
  });

  it('increments round counter', () => {
    const s1 = resolveTurn(createInitialState(), 'reload', 'reload');
    expect(s1.round).toBe(1);
    const s2 = resolveTurn(s1, 'reload', 'reload');
    expect(s2.round).toBe(2);
  });
});

describe('flipPerspective', () => {
  it('swaps player and opponent', () => {
    const s = {
      ...createInitialState(),
      player: { lives: 2, ammo: 1 },
      opponent: { lives: 3, ammo: 0 },
      lastPlayerAction: 'shoot' as const,
      lastOpponentAction: 'shield' as const,
    };
    const flipped = flipPerspective(s);
    expect(flipped.player).toEqual({ lives: 3, ammo: 0 });
    expect(flipped.opponent).toEqual({ lives: 2, ammo: 1 });
    expect(flipped.lastPlayerAction).toBe('shield');
    expect(flipped.lastOpponentAction).toBe('shoot');
  });

  it('inverts won ↔ lost', () => {
    const s = { ...createInitialState(), status: 'won' as const };
    expect(flipPerspective(s).status).toBe('lost');
  });

  it('keeps draw as draw', () => {
    const s = { ...createInitialState(), status: 'draw' as const };
    expect(flipPerspective(s).status).toBe('draw');
  });
});

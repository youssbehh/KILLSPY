/**
 * Pure game logic for KILLSPY 1v1.
 * Shared between API (PvP authoritative) and Game client (PvE bot).
 * Keep this file identical on both sides.
 */

export type GameAction = 'shield' | 'shoot' | 'reload';

export interface PlayerState {
  lives: number;
  ammo: number;
}

export type GameStatus = 'choosing' | 'won' | 'lost' | 'draw';

export interface GameState {
  player: PlayerState;
  opponent: PlayerState;
  round: number;
  status: GameStatus;
  lastPlayerAction: GameAction | null;
  lastOpponentAction: GameAction | null;
}

export const INITIAL_LIVES = 3;
export const MAX_AMMO = 3;
export const TURN_DURATION_MS = 5000;
export const COUNTDOWN_DURATION_MS = 3000;

export const createInitialState = (): GameState => ({
  player: { lives: INITIAL_LIVES, ammo: 0 },
  opponent: { lives: INITIAL_LIVES, ammo: 0 },
  round: 0,
  status: 'choosing',
  lastPlayerAction: null,
  lastOpponentAction: null,
});

/** Whether the player can legally perform this action given current ammo. */
export const isActionLegal = (player: PlayerState, action: GameAction): boolean => {
  if (action === 'shoot') return player.ammo > 0;
  if (action === 'reload') return player.ammo < MAX_AMMO;
  return true;
};

/** Pick a forced action when player skipped — for AFK / timeout cases. */
export const forcedAction = (player: PlayerState): GameAction => {
  if (player.ammo === 0) return 'reload';
  return 'shield';
};

const applySelf = (self: PlayerState, action: GameAction): PlayerState => {
  if (action === 'reload') {
    return { ...self, ammo: Math.min(self.ammo + 1, MAX_AMMO) };
  }
  if (action === 'shoot' && self.ammo > 0) {
    return { ...self, ammo: self.ammo - 1 };
  }
  return self;
};

const damageFrom = (shooter: PlayerState, target: PlayerState, shooterAction: GameAction, targetAction: GameAction): number => {
  if (shooterAction !== 'shoot') return 0;
  if (shooter.ammo <= 0) return 0;
  if (targetAction === 'shield') return 0;
  return 1;
};

/**
 * Resolve one turn. Both actions are applied simultaneously.
 * Returns the next state with the new status (choosing/won/lost/draw).
 */
export const resolveTurn = (state: GameState, playerAction: GameAction, opponentAction: GameAction): GameState => {
  if (state.status !== 'choosing') return state;

  const playerAmmoAfter = applySelf(state.player, playerAction);
  const opponentAmmoAfter = applySelf(state.opponent, opponentAction);

  const damageToPlayer = damageFrom(state.opponent, state.player, opponentAction, playerAction);
  const damageToOpponent = damageFrom(state.player, state.opponent, playerAction, opponentAction);

  const playerAfter: PlayerState = {
    ammo: playerAmmoAfter.ammo,
    lives: Math.max(0, state.player.lives - damageToPlayer),
  };
  const opponentAfter: PlayerState = {
    ammo: opponentAmmoAfter.ammo,
    lives: Math.max(0, state.opponent.lives - damageToOpponent),
  };

  let status: GameStatus = 'choosing';
  const playerDead = playerAfter.lives === 0;
  const opponentDead = opponentAfter.lives === 0;
  if (playerDead && opponentDead) status = 'draw';
  else if (opponentDead) status = 'won';
  else if (playerDead) status = 'lost';

  return {
    player: playerAfter,
    opponent: opponentAfter,
    round: state.round + 1,
    status,
    lastPlayerAction: playerAction,
    lastOpponentAction: opponentAction,
  };
};

/** Invert player/opponent perspective — useful for sending opponent-side snapshot. */
export const flipPerspective = (state: GameState): GameState => ({
  player: state.opponent,
  opponent: state.player,
  round: state.round,
  status: state.status === 'won' ? 'lost' : state.status === 'lost' ? 'won' : state.status,
  lastPlayerAction: state.lastOpponentAction,
  lastOpponentAction: state.lastPlayerAction,
});

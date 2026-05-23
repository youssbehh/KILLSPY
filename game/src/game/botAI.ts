import { GameAction, GameState, MAX_AMMO } from './gameEngine';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Easy: pure random (constrained by legality).
 * Medium: weighted random — tracks player's past actions to favor counters.
 * Hard: predictive — tries to anticipate player's next move and counter it.
 *
 * For now Phase 4 only ships `easy`. Medium/hard come in Phase 5.
 */
export interface BotMemory {
  playerHistory: GameAction[];
}

export const createBotMemory = (): BotMemory => ({ playerHistory: [] });

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const chooseBotAction = (
  state: GameState,
  memory: BotMemory,
  difficulty: BotDifficulty = 'easy',
): GameAction => {
  const opp = state.opponent;

  if (opp.ammo === 0) return 'reload';
  if (opp.ammo === MAX_AMMO) return pickRandom<GameAction>(['shoot', 'shield']);

  if (difficulty === 'easy') {
    return pickRandom<GameAction>(['reload', 'shoot', 'shield']);
  }

  if (difficulty === 'medium') {
    const recentShoots = memory.playerHistory.slice(-3).filter((a) => a === 'shoot').length;
    if (recentShoots >= 2) return 'shield';
    if (memory.playerHistory.slice(-2).every((a) => a === 'reload')) return 'shoot';
    return pickRandom<GameAction>(['reload', 'shoot', 'shield']);
  }

  if (state.player.ammo === 0) return 'reload';
  if (state.player.ammo === MAX_AMMO) return 'shield';
  const last = memory.playerHistory[memory.playerHistory.length - 1];
  if (last === 'reload') return 'shoot';
  if (last === 'shoot') return 'shield';
  return 'shoot';
};

export const rememberPlayerAction = (memory: BotMemory, action: GameAction): BotMemory => ({
  playerHistory: [...memory.playerHistory, action].slice(-10),
});

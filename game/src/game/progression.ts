/**
 * XP & level math. Shared between API (source of truth) and game client (display).
 * Keep this file identical on both sides.
 */

import type { GameMode, GameOutcome } from './ranking';

/** XP needed to go from level n to n+1 grows linearly: 100, 300, 500… (total = 100 × n²). */
export const xpForLevel = (level: number): number => 100 * (level - 1) * (level - 1);

export const levelFromXp = (xp: number): number => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;

/** 0 → 1 progress inside the current level. */
export const levelProgress = (xp: number): number => {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return (xp - floor) / (ceil - floor);
};

/** XP granted for a finished match. Training and friendly duels grant nothing. */
export const computeXpReward = (outcome: GameOutcome, mode: GameMode): number => {
  if (mode !== 'pvp_quick' && mode !== 'pvp_ranked') return 0;
  const base = outcome === 'won' ? 50 : outcome === 'draw' ? 25 : 15;
  return mode === 'pvp_ranked' ? Math.round(base * 1.5) : base;
};

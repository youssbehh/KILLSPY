/**
 * Money rewards per game outcome. Shared between API and game client.
 * Keep in sync with game/src/game/economy.ts.
 *
 * Rules:
 * - PvE: no reward (training mode).
 * - PvP Quick: small reward to keep casual players engaged.
 * - PvP Ranked: bigger rewards (effort-based).
 */

import type { GameMode, GameOutcome } from './ranking';

export const SIGNUP_BONUS = 100;

export const computeMoneyReward = (outcome: GameOutcome, mode: GameMode): number => {
  if (mode === 'pve') return 0;

  if (mode === 'pvp_quick') {
    if (outcome === 'won') return 20;
    if (outcome === 'lost') return 5;
    return 10;
  }

  // pvp_ranked
  if (outcome === 'won') return 50;
  if (outcome === 'lost') return 10;
  return 25;
};

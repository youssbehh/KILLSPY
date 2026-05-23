/**
 * Money rewards per game outcome. Shared between API and game client.
 * Keep in sync with api/src/game/economy.ts.
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

  if (outcome === 'won') return 50;
  if (outcome === 'lost') return 10;
  return 25;
};

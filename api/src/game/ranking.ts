/**
 * MMR & rank math. Shared between API (source of truth) and game client (display).
 * Keep this file identical on both sides.
 */

export type GameOutcome = 'won' | 'lost' | 'draw';
export type GameMode = 'pve' | 'pvp_quick' | 'pvp_ranked';

export interface RankTier {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  label: string;
  minMmr: number;
  color: string;
}

export const RANK_TIERS: RankTier[] = [
  { id: 'bronze', label: 'Bronze', minMmr: 0, color: '#cd7f32' },
  { id: 'silver', label: 'Argent', minMmr: 200, color: '#c0c0c0' },
  { id: 'gold', label: 'Or', minMmr: 500, color: '#ffd700' },
  { id: 'platinum', label: 'Platine', minMmr: 900, color: '#40e0d0' },
  { id: 'diamond', label: 'Diamant', minMmr: 1400, color: '#00ffff' },
  { id: 'master', label: 'Maître Espion', minMmr: 2000, color: '#ff00aa' },
];

export const mmrToRank = (mmr: number): RankTier => {
  let current = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (mmr >= tier.minMmr) current = tier;
    else break;
  }
  return current;
};

export const nextRank = (mmr: number): RankTier | null => {
  const current = mmrToRank(mmr);
  const idx = RANK_TIERS.findIndex((t) => t.id === current.id);
  if (idx === -1 || idx === RANK_TIERS.length - 1) return null;
  return RANK_TIERS[idx + 1];
};

export const progressToNext = (mmr: number): number => {
  const current = mmrToRank(mmr);
  const next = nextRank(mmr);
  if (!next) return 1;
  return (mmr - current.minMmr) / (next.minMmr - current.minMmr);
};

/**
 * Compute MMR delta. Only ranked games affect MMR.
 * - PvE (vs bot) and PvP Quick (casual): no MMR change. Games are still
 *   recorded in GameHistory for V/D stats, but with delta = 0.
 * - PvP Ranked: full Elo-style gain/loss.
 *
 * Floor handled separately by applyMmrDelta (cannot drop below 0).
 */
export const computeMmrDelta = (outcome: GameOutcome, mode: GameMode): number => {
  if (mode !== 'pvp_ranked') return 0;
  if (outcome === 'won') return 25;
  if (outcome === 'lost') return -20;
  return 5;
};

export const applyMmrDelta = (currentMmr: number, delta: number): number =>
  Math.max(0, currentMmr + delta);

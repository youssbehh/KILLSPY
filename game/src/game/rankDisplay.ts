import { TierName } from '../theme/colors';
import { RankTier, mmrToRank } from './ranking';

/**
 * Bridges the 6 competitive ranks (ranking.ts) to the 5 visual tiers of the
 * design system (RankBadge / HexAvatar).
 */
const VISUAL_TIER: Record<RankTier['id'], 0 | 1 | 2 | 3 | 4> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
  diamond: 3,
  master: 4,
};

const TIER_NAMES: TierName[] = ['bronze', 'silver', 'gold', 'diamond', 'phantom'];

export const rankTierIndex = (mmr: number): 0 | 1 | 2 | 3 | 4 => VISUAL_TIER[mmrToRank(mmr).id];

export const rankTierName = (mmr: number): TierName => TIER_NAMES[rankTierIndex(mmr)];

import { useLanguageStore } from '../stores/languageStore';
import { RankTier } from './ranking';
import { RarityId, RARITIES } from './rarities';

/**
 * Localised display names for ranks and rarities.
 * ranking.ts and rarities.ts are shared with the API and keep their French `label`;
 * the client shows these names instead, in the selected language (0 = fr, 1 = en).
 */

type RankId = RankTier['id'];

const RANK_NAMES: Record<RankId, { fr: string; en: string }> = {
  bronze: { fr: 'Bronze', en: 'Bronze' },
  silver: { fr: 'Argent', en: 'Silver' },
  gold: { fr: 'Or', en: 'Gold' },
  platinum: { fr: 'Platine', en: 'Platinum' },
  diamond: { fr: 'Diamant', en: 'Diamond' },
  master: { fr: 'Maître Espion', en: 'Master Spy' },
};

const RARITY_NAMES: Record<RarityId, { fr: string; en: string }> = {
  common: { fr: 'Commun', en: 'Common' },
  uncommon: { fr: 'Inhabituel', en: 'Uncommon' },
  rare: { fr: 'Rare', en: 'Rare' },
  epic: { fr: 'Épique', en: 'Epic' },
  legendary: { fr: 'Légendaire', en: 'Legendary' },
  mythic: { fr: 'Mythique', en: 'Mythic' },
  secret: { fr: 'Secret', en: 'Secret' },
};

const pick = (names: { fr: string; en: string }, langIndex: number) => (langIndex === 1 ? names.en : names.fr);

/** Rank name in the given language; falls back to the id for unknown ranks. */
export const rankLabel = (id: RankId | string, langIndex: number): string => {
  const names = RANK_NAMES[id as RankId];
  return names ? pick(names, langIndex) : id;
};

/** Rarity name in the given language; falls back to the shared label for unknown rarities. */
export const rarityLabel = (id: RarityId | string, langIndex: number): string => {
  const names = RARITY_NAMES[id as RarityId];
  return names ? pick(names, langIndex) : (RARITIES[id as RarityId]?.label ?? id);
};

/** Hook: `const rankName = useRankLabel(); rankName(rank.id)`. */
export const useRankLabel = () => {
  const langIndex = useLanguageStore((s) => s.langIndex);
  return (id: RankId | string) => rankLabel(id, langIndex);
};

/** Hook: `const rarityName = useRarityLabel(); rarityName(item.rarity)`. */
export const useRarityLabel = () => {
  const langIndex = useLanguageStore((s) => s.langIndex);
  return (id: RarityId | string) => rarityLabel(id, langIndex);
};

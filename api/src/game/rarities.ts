/**
 * Cosmetic rarity tiers. Shared between API and game client.
 * Keep in sync with game/src/game/rarities.ts.
 */

export type RarityId = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';

export interface RarityDef {
  id: RarityId;
  label: string;
  color: string;        // primary color (text / outline)
  glow: string;         // accent for halo / shadow
  weight: number;       // for random rolls (higher = more common)
}

export const RARITIES: Record<RarityId, RarityDef> = {
  common:    { id: 'common',    label: 'Commun',    color: '#9e9e9e', glow: '#cfcfcf', weight: 60 },
  uncommon:  { id: 'uncommon',  label: 'Inhabituel', color: '#2ecc71', glow: '#7fe6a4', weight: 25 },
  rare:      { id: 'rare',      label: 'Rare',      color: '#3498db', glow: '#7ec9f0', weight: 10 },
  epic:      { id: 'epic',      label: 'Épique',    color: '#9b59b6', glow: '#c9a5d8', weight: 4 },
  legendary: { id: 'legendary', label: 'Légendaire', color: '#ffd700', glow: '#fff3a0', weight: 0.8 },
  mythic:    { id: 'mythic',    label: 'Mythique',  color: '#e74c3c', glow: '#f5a397', weight: 0.18 },
  secret:    { id: 'secret',    label: 'Secret',    color: '#0a0a0a', glow: '#ffffff', weight: 0.02 },
};

export const RARITY_ORDER: RarityId[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret',
];

export const isRarityId = (s: string): s is RarityId => RARITY_ORDER.includes(s as RarityId);

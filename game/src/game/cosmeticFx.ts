/**
 * Purchasable combat effects. Items are matched by their name in the shop
 * catalogue (api/prisma/seed.ts); an unknown or missing name falls back to the
 * default look, so a new server item never breaks the duel screen.
 */

export type ShotShape = 'tracer' | 'beam' | 'orb' | 'burst';
export type ShieldShape = 'bar' | 'hex' | 'dome' | 'ice';

export interface ShotStyle {
  shape: ShotShape;
  /** null: the side's own colour (blue for me, orange for the opponent). */
  color: string | null;
}

export interface ShieldStyle {
  shape: ShieldShape;
  /** null: the default shield colour. */
  color: string | null;
}

/** What one player has equipped, as names (what the server sends). */
export interface CombatFxNames {
  shoot: string | null;
  shield: string | null;
}

export interface CombatLook {
  shot: ShotStyle;
  shield: ShieldStyle;
}

const SHOTS: Record<string, ShotStyle> = {
  'Tir laser': { shape: 'beam', color: '#ff2d55' },
  'Tir plasma': { shape: 'orb', color: '#a040ff' },
  'Rafale dorée': { shape: 'burst', color: '#ffc107' },
};

const SHIELDS: Record<string, ShieldStyle> = {
  'Bouclier hexagonal': { shape: 'hex', color: '#7be0ff' },
  "Dôme d'énergie": { shape: 'dome', color: '#a040ff' },
  'Mur de glace': { shape: 'ice', color: '#e0f7ff' },
};

export const DEFAULT_LOOK: CombatLook = {
  shot: { shape: 'tracer', color: null },
  shield: { shape: 'bar', color: null },
};

export const lookFor = (names: Partial<CombatFxNames> | null | undefined): CombatLook => ({
  shot: (names?.shoot && SHOTS[names.shoot]) || DEFAULT_LOOK.shot,
  shield: (names?.shield && SHIELDS[names.shield]) || DEFAULT_LOOK.shield,
});

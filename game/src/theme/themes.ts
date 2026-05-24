import { I18nKey } from '../i18n/keys';

export type ThemeId =
  | 'spyCasual'              // NOUVEAU défaut — Spy Casual Shooter
  | 'futurUrbain'
  | 'mystereNocturne'
  | 'infiltrationNaturelle'
  | 'technologieAvancee'
  | 'eleganceClassique';

export interface ThemeColors {
  // Backgrounds
  background: string;        // base écran
  surface: string;           // cartes
  surfaceAlt: string;        // cartes highlighted
  surfaceOverlay: string;    // panneaux glassmorphism

  // Brand / actions
  primary: string;           // mint — actions positives
  primaryDark: string;       // pour relief 3D
  primaryText: string;       // texte sur primary
  reward: string;            // or — XP, récompenses
  rewardDark: string;
  danger: string;            // rouge — vies, defeat
  dangerDark: string;
  info: string;              // cyan — secondary
  infoDark: string;

  // Resources
  money: string;             // doré
  gems: string;              // violet/cyan
  xp: string;                // mint
  hp: string;                // rouge

  // Text
  text: string;              // blanc principal
  textMuted: string;         // gris bleu
  textDim: string;           // texte secondaire

  // UI
  border: string;
  borderStrong: string;
  glow: string;              // shadow color pour halo
  overlay: string;           // modal backdrop
}

export interface Theme {
  id: ThemeId;
  labelKey: I18nKey | null;
  fallbackLabel: string;
  statusBar: 'light' | 'dark';
  colors: ThemeColors;
}

/**
 * Spy Casual Shooter — nouveau thème par défaut.
 * Mobile arcade casual avec mascotte chibi espion.
 * Palette : bleu marine + mint + or + rouge.
 */
const spyCasual: Theme = {
  id: 'spyCasual',
  labelKey: null,
  fallbackLabel: 'Agent Mint',
  statusBar: 'light',
  colors: {
    background: '#0d1929',
    surface: '#1a2b4a',
    surfaceAlt: '#243b6a',
    surfaceOverlay: 'rgba(26, 43, 74, 0.85)',

    primary: '#3FE7A0',
    primaryDark: '#2BBA82',
    primaryText: '#0d1929',
    reward: '#FFD700',
    rewardDark: '#FFA500',
    danger: '#FF3D3D',
    dangerDark: '#C92B2B',
    info: '#5BE0FF',
    infoDark: '#0099CC',

    money: '#FFC107',
    gems: '#B266FF',
    xp: '#3FE7A0',
    hp: '#FF3D3D',

    text: '#FFFFFF',
    textMuted: '#B8C5D6',
    textDim: '#6B7A95',

    border: 'rgba(255,255,255,0.1)',
    borderStrong: 'rgba(63,231,160,0.4)',
    glow: 'rgba(63,231,160,0.5)',
    overlay: 'rgba(13,25,41,0.85)',
  },
};

/** Futur Urbain — palette originale, gardée comme variant. */
const futurUrbain: Theme = {
  id: 'futurUrbain',
  labelKey: null,
  fallbackLabel: 'Futur Urbain',
  statusBar: 'light',
  colors: {
    background: '#343a40',
    surface: '#3f464d',
    surfaceAlt: '#495057',
    surfaceOverlay: 'rgba(63,70,77,0.85)',
    primary: '#007bff',
    primaryDark: '#0056b3',
    primaryText: '#ffffff',
    reward: '#ffc107',
    rewardDark: '#d39e00',
    danger: '#e74c3c',
    dangerDark: '#a82a1d',
    info: '#39ff14',
    infoDark: '#1aaf00',
    money: '#ffc107',
    gems: '#9b59b6',
    xp: '#39ff14',
    hp: '#e74c3c',
    text: '#ffffff',
    textMuted: '#d3d3d3',
    textDim: '#8a8a8a',
    border: '#495057',
    borderStrong: '#007bff',
    glow: 'rgba(0,123,255,0.5)',
    overlay: 'rgba(0,0,0,0.55)',
  },
};

const mystereNocturne: Theme = {
  id: 'mystereNocturne',
  labelKey: null,
  fallbackLabel: 'Mystère Nocturne',
  statusBar: 'light',
  colors: {
    background: '#000000',
    surface: '#1a1a1a',
    surfaceAlt: '#2e2e2e',
    surfaceOverlay: 'rgba(26,26,26,0.9)',
    primary: '#4a5a2d',
    primaryDark: '#2d3818',
    primaryText: '#c0c0c0',
    reward: '#c0c0c0',
    rewardDark: '#808080',
    danger: '#8b0000',
    dangerDark: '#5a0000',
    info: '#001f3f',
    infoDark: '#000d1a',
    money: '#c0c0c0',
    gems: '#001f3f',
    xp: '#4a5a2d',
    hp: '#8b0000',
    text: '#c0c0c0',
    textMuted: '#7a7a7a',
    textDim: '#555555',
    border: '#2e2e2e',
    borderStrong: '#4a5a2d',
    glow: 'rgba(192,192,192,0.3)',
    overlay: 'rgba(0,0,0,0.85)',
  },
};

const infiltrationNaturelle: Theme = {
  id: 'infiltrationNaturelle',
  labelKey: null,
  fallbackLabel: 'Infiltration Naturelle',
  statusBar: 'dark',
  colors: {
    background: '#f5f5dc',
    surface: '#ffffff',
    surfaceAlt: '#f0e68c',
    surfaceOverlay: 'rgba(245,245,220,0.92)',
    primary: '#228b22',
    primaryDark: '#1a6b1a',
    primaryText: '#ffffff',
    reward: '#ffd700',
    rewardDark: '#c8a500',
    danger: '#a0522d',
    dangerDark: '#6b371e',
    info: '#8b4513',
    infoDark: '#5a2c0c',
    money: '#ffd700',
    gems: '#ff4500',
    xp: '#228b22',
    hp: '#a0522d',
    text: '#2d3a1f',
    textMuted: '#5a6a3a',
    textDim: '#8a9a6a',
    border: '#c8c8a8',
    borderStrong: '#228b22',
    glow: 'rgba(34,139,34,0.4)',
    overlay: 'rgba(45,58,31,0.5)',
  },
};

const technologieAvancee: Theme = {
  id: 'technologieAvancee',
  labelKey: null,
  fallbackLabel: 'Technologie Avancée',
  statusBar: 'light',
  colors: {
    background: '#000000',
    surface: '#0a0a14',
    surfaceAlt: '#141428',
    surfaceOverlay: 'rgba(10,10,20,0.9)',
    primary: '#00ffff',
    primaryDark: '#00aaaa',
    primaryText: '#000000',
    reward: '#40e0d0',
    rewardDark: '#2a9d8f',
    danger: '#ff00aa',
    dangerDark: '#aa0070',
    info: '#800080',
    infoDark: '#400040',
    money: '#40e0d0',
    gems: '#800080',
    xp: '#00ffff',
    hp: '#ff00aa',
    text: '#ffffff',
    textMuted: '#c0c0c0',
    textDim: '#7a7a7a',
    border: 'rgba(0,255,255,0.2)',
    borderStrong: '#00ffff',
    glow: 'rgba(0,255,255,0.6)',
    overlay: 'rgba(0,255,255,0.15)',
  },
};

const eleganceClassique: Theme = {
  id: 'eleganceClassique',
  labelKey: null,
  fallbackLabel: 'Élégance Classique',
  statusBar: 'light',
  colors: {
    background: '#001f3f',
    surface: '#0a2f4f',
    surfaceAlt: '#1a3f5f',
    surfaceOverlay: 'rgba(10,47,79,0.9)',
    primary: '#ffd700',
    primaryDark: '#c8a500',
    primaryText: '#001f3f',
    reward: '#cd7f32',
    rewardDark: '#8a541f',
    danger: '#800000',
    dangerDark: '#500000',
    info: '#cd7f32',
    infoDark: '#8a541f',
    money: '#ffd700',
    gems: '#cd7f32',
    xp: '#ffd700',
    hp: '#800000',
    text: '#fffdd0',
    textMuted: '#a9a9a9',
    textDim: '#7a7a7a',
    border: '#cd7f32',
    borderStrong: '#ffd700',
    glow: 'rgba(255,215,0,0.5)',
    overlay: 'rgba(0,31,63,0.7)',
  },
};

export const themes: Record<ThemeId, Theme> = {
  spyCasual,
  futurUrbain,
  mystereNocturne,
  infiltrationNaturelle,
  technologieAvancee,
  eleganceClassique,
};

/**
 * Ordered list — first is the default offered for free at signup.
 * The 5 others are sold as cosmetics in the shop (different rarities).
 */
export const THEME_IDS: ThemeId[] = [
  'spyCasual',
  'futurUrbain',
  'mystereNocturne',
  'infiltrationNaturelle',
  'technologieAvancee',
  'eleganceClassique',
];

export const DEFAULT_THEME_ID: ThemeId = 'spyCasual';

/** Mapping for shop pricing/rarity when seeding cosmetic items. */
export const THEME_COSMETIC_META: Record<ThemeId, {
  label: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';
  price: number;
}> = {
  spyCasual:            { label: 'Agent Mint',           description: 'Bleu marine + mint frais. Le thème par défaut.',         rarity: 'common',    price: 0 },
  futurUrbain:          { label: 'Futur Urbain',         description: 'Gris moderne + bleu électrique + accent vert néon.',    rarity: 'uncommon',  price: 250 },
  infiltrationNaturelle:{ label: 'Infiltration Naturelle', description: 'Camouflage forêt — beige, vert kaki, marron.',         rarity: 'rare',      price: 500 },
  mystereNocturne:      { label: 'Mystère Nocturne',     description: 'Noir absolu + olive militaire + rouge sang.',           rarity: 'epic',      price: 900 },
  technologieAvancee:   { label: 'Technologie Avancée',  description: 'Cyan néon + violet sur noir profond. Cyberpunk.',       rarity: 'legendary', price: 1500 },
  eleganceClassique:    { label: 'Élégance Classique',   description: 'Bleu marine + or + bordeaux. Casino royal.',            rarity: 'mythic',    price: 3000 },
};

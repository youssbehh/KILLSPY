import { I18nKey } from '../i18n/keys';

export type ThemeId =
  | 'futurUrbain'
  | 'mystereNocturne'
  | 'infiltrationNaturelle'
  | 'technologieAvancee'
  | 'eleganceClassique';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryText: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  overlay: string;
}

export interface Theme {
  id: ThemeId;
  labelKey: I18nKey | null;
  fallbackLabel: string;
  statusBar: 'light' | 'dark';
  colors: ThemeColors;
}

/**
 * Futur Urbain — thème de base, moderne et futuriste.
 * Bleu et jaune vifs sur structure gris foncé.
 */
const futurUrbain: Theme = {
  id: 'futurUrbain',
  labelKey: null,
  fallbackLabel: 'Futur Urbain',
  statusBar: 'light',
  colors: {
    background: '#343a40',
    surface: '#3f464d',
    surfaceAlt: '#495057',
    primary: '#007bff',
    primaryText: '#ffffff',
    secondary: '#ffc107',
    accent: '#39ff14',
    text: '#ffffff',
    textMuted: '#d3d3d3',
    border: '#495057',
    success: '#39ff14',
    danger: '#e74c3c',
    overlay: 'rgba(0,0,0,0.55)',
  },
};

/**
 * Mystère Nocturne — sombre et secret. Infiltration de nuit.
 */
const mystereNocturne: Theme = {
  id: 'mystereNocturne',
  labelKey: null,
  fallbackLabel: 'Mystère Nocturne',
  statusBar: 'light',
  colors: {
    background: '#000000',
    surface: '#2e2e2e',
    surfaceAlt: '#1a1a1a',
    primary: '#4a5a2d',
    primaryText: '#c0c0c0',
    secondary: '#001f3f',
    accent: '#c0c0c0',
    text: '#c0c0c0',
    textMuted: '#7a7a7a',
    border: '#2e2e2e',
    success: '#4a5a2d',
    danger: '#8b0000',
    overlay: 'rgba(0,0,0,0.75)',
  },
};

/**
 * Infiltration Naturelle — extérieur, camouflage.
 */
const infiltrationNaturelle: Theme = {
  id: 'infiltrationNaturelle',
  labelKey: null,
  fallbackLabel: 'Infiltration Naturelle',
  statusBar: 'dark',
  colors: {
    background: '#f5f5dc',
    surface: '#ffffff',
    surfaceAlt: '#f0e68c',
    primary: '#228b22',
    primaryText: '#ffffff',
    secondary: '#8b4513',
    accent: '#ff4500',
    text: '#2d3a1f',
    textMuted: '#5a6a3a',
    border: '#c8c8a8',
    success: '#228b22',
    danger: '#a0522d',
    overlay: 'rgba(45,58,31,0.5)',
  },
};

/**
 * Technologie Avancée — high-tech, sci-fi.
 */
const technologieAvancee: Theme = {
  id: 'technologieAvancee',
  labelKey: null,
  fallbackLabel: 'Technologie Avancée',
  statusBar: 'light',
  colors: {
    background: '#000000',
    surface: '#0a0a14',
    surfaceAlt: '#141428',
    primary: '#00ffff',
    primaryText: '#000000',
    secondary: '#800080',
    accent: '#40e0d0',
    text: '#ffffff',
    textMuted: '#c0c0c0',
    border: '#c0c0c0',
    success: '#40e0d0',
    danger: '#ff00aa',
    overlay: 'rgba(0,255,255,0.15)',
  },
};

/**
 * Élégance Classique — VIP, prestige, sobriété.
 */
const eleganceClassique: Theme = {
  id: 'eleganceClassique',
  labelKey: null,
  fallbackLabel: 'Élégance Classique',
  statusBar: 'light',
  colors: {
    background: '#001f3f',
    surface: '#0a2f4f',
    surfaceAlt: '#1a3f5f',
    primary: '#ffd700',
    primaryText: '#001f3f',
    secondary: '#800000',
    accent: '#cd7f32',
    text: '#fffdd0',
    textMuted: '#a9a9a9',
    border: '#cd7f32',
    success: '#ffd700',
    danger: '#800000',
    overlay: 'rgba(0,31,63,0.7)',
  },
};

export const themes: Record<ThemeId, Theme> = {
  futurUrbain,
  mystereNocturne,
  infiltrationNaturelle,
  technologieAvancee,
  eleganceClassique,
};

export const THEME_IDS: ThemeId[] = [
  'futurUrbain',
  'mystereNocturne',
  'infiltrationNaturelle',
  'technologieAvancee',
  'eleganceClassique',
];

export const DEFAULT_THEME_ID: ThemeId = 'futurUrbain';

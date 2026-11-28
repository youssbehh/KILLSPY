// KS design tokens. BASE is the hand-tuned "Futur Urbain" look; the equipped theme
// (read once at startup, see activeTheme.ts) recolours it before any style is built.
import { ACTIVE_THEME_ID } from './activeTheme';
import { ThemeId, themes } from './themes';

const BASE = {
  // Surfaces (deepest → highest)
  bg:        '#1f242a',
  surface:   '#343a40',
  surfaceHi: '#3f464d',
  glass:     'rgba(52,58,64,0.62)',
  glassHi:   'rgba(63,70,77,0.78)',

  // Ink
  ink:       '#ffffff',
  inkMute:   '#d3d3d3',
  inkDim:    'rgba(211,211,211,0.55)',
  inkFaint:  'rgba(211,211,211,0.25)',

  // Action / state
  primary:     '#007bff',
  /** Text and icons drawn on a primary-coloured surface. */
  onPrimary:   '#ffffff',
  primaryGlow: 'rgba(0,123,255,0.55)',
  alert:       '#ffc107',
  live:        '#39ff14',
  danger:      '#ff3b30',
  enemy:       '#ff6b35',

  // Structure
  hair:     'rgba(0,123,255,0.45)',
  hairSoft: 'rgba(255,255,255,0.08)',
  divider:  'rgba(255,255,255,0.06)',

  // Rank tier colors
  tier: {
    bronze:  '#cd7f32',
    silver:  '#c0c0c0',
    gold:    '#ffc107',
    diamond: '#7be0ff',
    phantom: '#ff3b30',
  },

  // Rarity (shop)
  rarity: {
    common:    '#d3d3d3',
    rare:      '#007bff',
    epic:      '#a040ff',
    legendary: '#ffc107',
  },
};

export type Palette = typeof BASE;

/** '#rrggbb' → 'rgba(r,g,b,alpha)' (other formats are returned unchanged). */
export const withAlpha = (hex: string, alpha: number): string => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

/** Mixes two '#rrggbb' colours (t = 0 → a, 1 → b). */
export const mix = (a: string, b: string, t: number): string => {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const [x, y] = [parse(a), parse(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

/** Palette of a theme, expressed with the tokens every screen uses. */
export const paletteFor = (id: ThemeId): Palette => {
  // Futur Urbain is the look the interface was designed with: keep it exact.
  if (id === 'futurUrbain') return BASE;
  const c = themes[id].colors;
  return {
    ...BASE,
    bg: c.background,
    surface: c.surface,
    surfaceHi: c.surfaceAlt,
    glass: c.surfaceOverlay,
    glassHi: c.surfaceOverlay,
    ink: c.text,
    inkMute: c.textMuted,
    inkDim: withAlpha(c.textMuted, 0.6),
    inkFaint: withAlpha(c.textMuted, 0.3),
    primary: c.primary,
    onPrimary: c.primaryText,
    primaryGlow: c.glow,
    alert: c.reward,
    live: c.xp,
    danger: c.danger,
    hair: withAlpha(c.primary, 0.45),
    hairSoft: withAlpha(c.text, 0.1),
    divider: withAlpha(c.text, 0.07),
  };
};

export const KS: Palette = paletteFor(ACTIVE_THEME_ID);

/** Light themes need dark status bar icons. */
export const STATUS_BAR_STYLE = themes[ACTIVE_THEME_ID].statusBar;

export type TierName = keyof typeof KS.tier;
export type RarityName = keyof typeof KS.rarity;

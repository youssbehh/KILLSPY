/**
 * Design tokens v2 — "Spy Casual Shooter".
 * Shared primitives consumed by every UI component.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 40,
  hero: 56,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

/**
 * Sticker-style 3D button shadows: an inner darker bottom edge gives the
 * "physical button" feel. Use as `borderBottomWidth` on the button.
 */
export const stickerRelief = {
  sm: 3,
  md: 4,
  lg: 6,
} as const;

/**
 * Drop shadows for floating elements (cards, modals, headers).
 * Use with the helper applyShadow() since RN shadow props differ from web.
 */
export const elevation = {
  none:   { ios: { opacity: 0,    radius: 0,  offsetY: 0 }, android: 0, webBlur: 0  },
  low:    { ios: { opacity: 0.15, radius: 4,  offsetY: 2 }, android: 2, webBlur: 6  },
  medium: { ios: { opacity: 0.25, radius: 8,  offsetY: 4 }, android: 5, webBlur: 12 },
  high:   { ios: { opacity: 0.35, radius: 16, offsetY: 8 }, android: 8, webBlur: 24 },
} as const;

/** Glow halos used behind glowing buttons / equipped items / level-up bursts. */
export const glow = {
  small:  { blur: 12, spread: 0 },
  medium: { blur: 24, spread: 4 },
  large:  { blur: 48, spread: 8 },
} as const;

/** Animation timings — keep them snappy for a "juicy" gamefeel. */
export const motion = {
  fast:    150,
  normal:  250,
  slow:    400,
  hero:    700,
  spring:  { damping: 12, stiffness: 180 },
  bounce:  { damping: 8,  stiffness: 220 },
} as const;

/** Common gradient stops — used in backgrounds and progress bars. */
export const gradients = {
  bgDark:    ['#0d1929', '#1a2b4a'],
  bgMid:     ['#1a2b4a', '#243b6a'],
  mintBtn:   ['#4FFFB0', '#2BBA82'],
  goldBtn:   ['#FFE066', '#FFA500'],
  redBtn:    ['#FF6B6B', '#C92B2B'],
  cyanBtn:   ['#5BE0FF', '#0099CC'],
  xpBar:     ['#3FE7A0', '#FFD700'],
  rankBar:   ['#FFD700', '#FF8C00'],
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type FontSize = typeof fontSize;

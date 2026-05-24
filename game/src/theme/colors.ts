// KS design tokens — "Futur Urbain" default palette
export const KS = {
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
} as const;

export type TierName = keyof typeof KS.tier;
export type RarityName = keyof typeof KS.rarity;

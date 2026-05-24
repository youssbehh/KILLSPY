export const TYPO = {
  display: 'BarlowCondensed_800ExtraBold',
  ui:      'Rajdhani_500Medium',
  uiBold:  'Rajdhani_700Bold',
  mono:    'JetBrainsMono_500Medium',
  monoBold:'JetBrainsMono_700Bold',
} as const;

export const SIZES = {
  logoXL:  84,
  hero:    38,
  titleLg: 30,
  titleMd: 22,
  titleSm: 18,
  labelLg: 14,
  bodyLg:  16,
  body:    14,
  bodySm:  13,
  monoLg:  14,
  monoMd:  11,
  monoSm:  10,
  monoXs:   9,
  monoXxs:  8,
} as const;

// Letter spacing: RN uses absolute px, so multiply by fontSize.
// display UPPERCASE → 0.04 × size (base), 0.06–0.18 for impact
// mono            → 0.18–0.32 × size
// ui body         → 0

export function ls(fontSize: number, em: number): number {
  return Math.round(fontSize * em);
}

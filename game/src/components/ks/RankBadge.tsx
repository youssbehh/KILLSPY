import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { KS, TierName } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

const RANK_NAMES = ['RECRUIT', 'OPERATIVE', 'AGENT', 'SPECIALIST', 'PHANTOM'] as const;
const RANK_TIERS: TierName[] = ['bronze', 'silver', 'gold', 'diamond', 'phantom'];

// Simple glyph paths scaled to a ~20px viewBox
const RANK_GLYPHS = [
  // 0: single chevron (RECRUIT)
  'M6,14 L10,8 L14,14',
  // 1: double chevron (OPERATIVE)
  'M6,14 L10,9 L14,14 M6,10 L10,5 L14,10',
  // 2: triple chevron (AGENT)
  'M6,15 L10,11 L14,15 M6,11 L10,7 L14,11 M6,7 L10,3 L14,7',
  // 3: octagon-diamond (SPECIALIST)
  'M10,2 L14,6 L14,14 L10,18 L6,14 L6,6 Z M10,5 L10,15 M7,10 L13,10',
  // 4: 5-point crest (PHANTOM)
  'M10,2 L11.5,7 L16,7 L12.5,10 L14,15 L10,12 L6,15 L7.5,10 L4,7 L8.5,7 Z',
];

interface Props {
  tier: 0 | 1 | 2 | 3 | 4;
  size?: number;
  showName?: boolean;
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export const RankBadge: React.FC<Props> = ({ tier, size = 32, showName = false }) => {
  const tierName = RANK_TIERS[tier];
  const color = KS.tier[tierName];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;

  // Scale the 20px glyph path to the badge size
  const glyphPath = RANK_GLYPHS[tier];
  const scale = size / 20;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={`rbg-${tier}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.9" />
            <Stop offset="1" stopColor={KS.bg} stopOpacity="0.95" />
          </LinearGradient>
        </Defs>
        {/* Hex background */}
        <Polygon
          points={hexPoints(cx, cy, r)}
          fill={`url(#rbg-${tier})`}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Tier glyph */}
        <Path
          d={glyphPath}
          stroke={KS.ink}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`scale(${scale}) translate(0, 0)`}
        />
      </Svg>
      {showName && (
        <Text
          style={{
            color: color,
            fontFamily: TYPO.mono,
            fontSize: SIZES.monoXs,
            letterSpacing: SIZES.monoXs * 0.18,
            marginTop: 2,
          }}
        >
          {RANK_NAMES[tier]}
        </Text>
      )}
    </View>
  );
};

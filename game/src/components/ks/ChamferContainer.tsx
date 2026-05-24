import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { KS } from '../../theme/colors';

export type ChamferVariant = 'tr-bl' | 'tl-br' | 'all';

interface Props {
  width: number;
  height: number;
  chamfer?: number;
  variant?: ChamferVariant;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function buildPoints(
  w: number,
  h: number,
  c: number,
  variant: ChamferVariant,
): string {
  // Corners: TL, TR, BR, BL
  // 'tr-bl' → clip top-right + bottom-left
  // 'tl-br' → clip top-left + bottom-right
  // 'all'   → clip all 4

  const tl = variant === 'tl-br' || variant === 'all';
  const tr = variant === 'tr-bl' || variant === 'all';
  const br = variant === 'tl-br' || variant === 'all';
  const bl = variant === 'tr-bl' || variant === 'all';

  const pts: [number, number][] = [];

  // Top-left corner
  if (tl) {
    pts.push([c, 0]);
  } else {
    pts.push([0, 0]);
  }

  // Top-right corner
  if (tr) {
    pts.push([w - c, 0]);
    pts.push([w, c]);
  } else {
    pts.push([w, 0]);
  }

  // Bottom-right corner
  if (br) {
    pts.push([w, h - c]);
    pts.push([w - c, h]);
  } else {
    pts.push([w, h]);
  }

  // Bottom-left corner
  if (bl) {
    pts.push([c, h]);
    pts.push([0, h - c]);
  } else {
    pts.push([0, h]);
  }

  // Close top-left if clipped
  if (tl) {
    pts.push([0, c]);
  }

  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

export const ChamferContainer: React.FC<Props> = ({
  width,
  height,
  chamfer = 10,
  variant = 'tr-bl',
  fill = KS.surface,
  stroke = KS.hair,
  strokeWidth = 1,
  children,
  style,
}) => {
  const points = buildPoints(width, height, chamfer, variant);

  return (
    <View style={[{ width, height }, style]}>
      <Svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </Svg>
      {children}
    </View>
  );
};

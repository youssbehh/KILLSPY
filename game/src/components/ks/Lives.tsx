import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { KS } from '../../theme/colors';

interface Props {
  total?: number;
  alive: number;
}

const SIZE = 22;

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }).map((_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

const LifeToken: React.FC<{ index: number; isAlive: boolean }> = ({ index, isAlive }) => {
  const id = `life-${index}`;
  const c1 = isAlive ? '#ff6b6b' : KS.surfaceHi;
  const c2 = isAlive ? '#ff3b30' : KS.surface;

  return (
    <Svg width={SIZE} height={SIZE}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c1} />
          <Stop offset="1" stopColor={c2} />
        </LinearGradient>
      </Defs>
      <Polygon
        points={hexPoints(SIZE / 2, SIZE / 2, SIZE / 2 - 1)}
        fill={`url(#${id})`}
        stroke={isAlive ? '#ff3b30' : KS.hairSoft}
        strokeWidth={1}
      />
      {isAlive ? (
        <Path
          d="M11,8 C11,7 10,6 9,6.5 C8,7 7,8 7,9.5 C7,11.5 11,14 11,14 C11,14 15,11.5 15,9.5 C15,8 14,7 13,6.5 C12,6 11,7 11,8 Z"
          fill="white"
          opacity={0.9}
        />
      ) : (
        <Path
          d="M8,8 L14,14 M14,8 L8,14"
          stroke={KS.inkFaint}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
};

export const Lives: React.FC<Props> = ({ total = 3, alive }) => (
  <View style={styles.row}>
    {Array.from({ length: total }).map((_, i) => (
      <LifeToken key={i} index={i} isAlive={i < alive} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
});

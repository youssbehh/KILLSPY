import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { KS } from '../../theme/colors';
import { MOTION } from '../../theme/motion';

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

  const reducedMotion = useReducedMotion();
  const wasAlive = useRef(isAlive);
  const scale = useSharedValue(1);
  const burst = useSharedValue(0);

  useEffect(() => {
    const lost = wasAlive.current && !isAlive;
    wasAlive.current = isAlive;
    if (!lost || reducedMotion) return;
    // The heart swells, then snaps down into its broken state while a ring bursts out.
    scale.value = withDelay(
      MOTION.lifeLossDelay,
      withSequence(
        withTiming(1.7, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0.7, { duration: 110 }),
        withTiming(1, { duration: 160, easing: Easing.out(Easing.back(2)) }),
      ),
    );
    burst.value = 0;
    burst.value = withDelay(MOTION.lifeLossDelay, withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }));
  }, [isAlive, reducedMotion, scale, burst]);

  const tokenStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value === 0 ? 0 : 1 - burst.value,
    transform: [{ scale: 1 + burst.value * 1.6 }],
  }));

  return (
    <View>
      <Animated.View style={[styles.burst, burstStyle]} />
      <Animated.View style={tokenStyle}>
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
      </Animated.View>
    </View>
  );
};

export const Lives: React.FC<Props> = ({ total = 3, alive }) => {
  const reducedMotion = useReducedMotion();
  const previous = useRef(alive);
  const shake = useSharedValue(0);

  useEffect(() => {
    const lost = alive < previous.current;
    previous.current = alive;
    if (!lost || reducedMotion) return;
    // The whole row rattles when a life is taken.
    const step = { duration: MOTION.ammoShake };
    shake.value = withDelay(
      MOTION.lifeLossDelay,
      withSequence(
        withTiming(-5, step),
        withTiming(5, step),
        withTiming(-3, step),
        withTiming(3, step),
        withTiming(0, step),
      ),
    );
  }, [alive, reducedMotion, shake]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Animated.View
      style={[styles.row, rowStyle]}
      accessible
      accessibilityLabel={`${alive} of ${total} lives`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <LifeToken key={i} index={i} isAlive={i < alive} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  burst: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: KS.danger,
  },
});

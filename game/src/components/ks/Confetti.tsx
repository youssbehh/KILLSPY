import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';

const PIECES = 44;
const DURATION = 2600;

interface Piece {
  x: number;
  drift: number;
  delay: number;
  spin: number;
  size: number;
  color: string;
  round: boolean;
}

/** Deterministic pseudo-random sequence: the same burst on every render of a given seed. */
const random = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/**
 * Victory confetti: a one-shot burst falling over the whole screen.
 * Purely decorative (no touch, hidden from screen readers) and skipped when the
 * system asks for reduced motion.
 */
export const Confetti: React.FC<{ seed?: number }> = ({ seed = 7 }) => {
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  const pieces = useMemo<Piece[]>(() => {
    const next = random(seed);
    const colors = [KS.primary, KS.alert, KS.live, KS.tier.diamond, KS.rarity.epic, KS.ink];
    return Array.from({ length: PIECES }, () => ({
      x: next() * width,
      drift: (next() - 0.5) * 120,
      delay: next() * 0.35,
      spin: (next() - 0.5) * 1440,
      size: 6 + next() * 7,
      color: colors[Math.floor(next() * colors.length)],
      round: next() > 0.6,
    }));
  }, [seed, width]);

  useEffect(() => {
    if (reducedMotion) return;
    progress.value = 0;
    progress.value = withDelay(120, withTiming(1, { duration: DURATION, easing: Easing.linear }));
  }, [progress, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={progress} height={height} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<{ piece: Piece; progress: SharedValue<number>; height: number }> = ({
  piece,
  progress,
  height,
}) => {
  const style = useAnimatedStyle(() => {
    // Each piece starts a little later and falls for the rest of the timeline.
    const local = Math.max(0, (progress.value - piece.delay) / (1 - piece.delay));
    const eased = 1 - (1 - local) * (1 - local);
    return {
      opacity: interpolate(local, [0, 0.05, 0.8, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: piece.x + piece.drift * eased },
        { translateY: -40 + (height + 80) * local },
        { rotate: `${piece.spin * local}deg` },
        { rotateX: `${piece.spin * 0.6 * local}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.45,
          borderRadius: piece.round ? piece.size / 2 : 1,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0 },
});

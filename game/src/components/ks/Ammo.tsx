import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { MOTION } from '../../theme/motion';

interface Props {
  current: number;
  max?: number;
  color?: string;
}

const Pip: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  const reducedMotion = useReducedMotion();
  const wasActive = useRef(active);
  const scaleY = useSharedValue(1);

  useEffect(() => {
    const changed = wasActive.current !== active;
    wasActive.current = active;
    if (!changed || reducedMotion) return;
    if (active) {
      // Round chambered: the pip snaps in from below, timed with the end of the reload ring.
      scaleY.value = 0.2;
      scaleY.value = withDelay(
        MOTION.reloadPipDelay,
        withSequence(
          withTiming(1.9, { duration: 140, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 180, easing: Easing.out(Easing.back(2)) }),
        ),
      );
    } else {
      // Round fired: the pip kicks, then settles empty.
      scaleY.value = withSequence(
        withTiming(1.8, { duration: 70 }),
        withTiming(0.4, { duration: 90 }),
        withTiming(1, { duration: 160 }),
      );
    }
  }, [active, reducedMotion, scaleY]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: scaleY.value }] }));

  return (
    <Animated.View
      style={[
        styles.pip,
        {
          backgroundColor: active ? color : 'rgba(255,255,255,0.08)',
          shadowColor: active ? color : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: active ? 0.8 : 0,
          shadowRadius: 2,
          elevation: active ? 2 : 0,
        },
        style,
      ]}
    />
  );
};

export const Ammo: React.FC<Props> = ({ current, max = 6, color = KS.primary }) => (
  <View style={styles.container} accessible accessibilityLabel={`${current} of ${max} ammo`}>
    <View style={styles.pips}>
      {Array.from({ length: max }).map((_, i) => (
        <Pip key={i} active={i < current} color={color} />
      ))}
    </View>
    <Text style={[styles.count, { color }]}>{current}/{max}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pips: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  pip: { width: 3, height: 14, borderRadius: 1.5 },
  count: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoSm,
  },
});

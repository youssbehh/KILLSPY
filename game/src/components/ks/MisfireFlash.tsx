import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { useLocalT } from '../../i18n/local';

const STRINGS = {
  fr: { title: 'ENRAYÉ', sub: 'CLIC — CHARGEUR VIDE · RECHARGE', a11y: 'Chargeur vide : recharge avant de tirer.' },
  en: { title: 'MISFIRE', sub: 'CLICK — EMPTY MAGAZINE · RELOAD', a11y: 'Empty magazine: reload before firing.' },
} as const;

/**
 * Feedback when the player tries to fire with an empty magazine: the trigger
 * clicks, the stamp jolts, nothing is sent. Shooting stays impossible — this
 * only says why. Bump `trigger` to replay it.
 */
export const MisfireFlash: React.FC<{ trigger: number }> = ({ trigger }) => {
  const t = useLocalT(STRINGS);
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    AccessibilityInfo.announceForAccessibility(t('a11y'));
    opacity.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(1, { duration: 650 }),
      withTiming(0, { duration: 250 }),
    );
    if (reducedMotion) return;
    scale.value = withSequence(withTiming(1.25, { duration: 60 }), withTiming(1, { duration: 180, easing: Easing.out(Easing.back(2)) }));
    shake.value = withSequence(
      withTiming(-10, { duration: 40 }),
      withTiming(10, { duration: 40 }),
      withTiming(-7, { duration: 40 }),
      withTiming(7, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: shake.value }, { scale: scale.value }, { rotate: '-4deg' }],
  }));

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.title}>{t('title')}</Text>
      <Text style={styles.sub}>{t('sub')}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: KS.danger,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  title: {
    color: KS.danger,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.12,
  },
  sub: {
    color: KS.inkMute,
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.14,
  },
});

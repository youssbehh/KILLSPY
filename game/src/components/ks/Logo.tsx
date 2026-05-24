import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { MOTION } from '../../theme/motion';

interface Props {
  size?: number;
  animated?: boolean;
  stamp?: boolean;
  color?: string;
}

const LETTERS = ['K', 'I', 'L', 'L', ' ', 'S', 'P', 'Y'];

function LetterIn({
  letter,
  index,
  size,
  color,
  animated: anim,
}: {
  letter: string;
  index: number;
  size: number;
  color: string;
  animated: boolean;
}) {
  const opacity = useSharedValue(anim ? 0 : 1);
  const translateY = useSharedValue(anim ? 8 : 0);

  useEffect(() => {
    if (!anim) return;
    const delay = index * MOTION.letterStagger;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: MOTION.letterIn, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: MOTION.letterIn, easing: Easing.out(Easing.cubic) }),
    );
  }, [anim]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Extra space between KILL and SPY
  const extraSpacing = index === 4 ? size * 0.18 : size * 0.04;

  return (
    <Animated.Text
      style={[
        {
          fontFamily: TYPO.display,
          fontSize: size,
          color,
          letterSpacing: extraSpacing,
          lineHeight: size * 1.05,
          includeFontPadding: false,
        },
        animStyle,
      ]}
    >
      {letter}
    </Animated.Text>
  );
}

export const Logo: React.FC<Props> = ({
  size = SIZES.logoXL,
  animated = false,
  stamp = false,
  color = KS.ink,
}) => {
  const inner = (
    <View style={styles.row}>
      {LETTERS.map((letter, i) => (
        <LetterIn
          key={i}
          letter={letter}
          index={i}
          size={size}
          color={color}
          animated={animated}
        />
      ))}
    </View>
  );

  if (stamp) {
    return (
      <View
        style={[
          styles.stamp,
          {
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
      >
        {inner}
      </View>
    );
  }

  return inner;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  stamp: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

import React, { useEffect } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { MOTION } from '../../theme/motion';

interface Props {
  label: string;
  subLabel?: string;
  onPress?: () => void;
  size?: 'large' | 'medium';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton: React.FC<Props> = ({
  label,
  subLabel,
  onPress,
  size = 'large',
  disabled = false,
  style,
}) => {
  const height = size === 'large' ? 60 : 48;
  const scale = useSharedValue(1);
  const glowRadius = useSharedValue(0);

  useEffect(() => {
    // Glow pulse loop
    glowRadius.value = withRepeat(
      withSequence(
        withTiming(20, { duration: MOTION.glowPulse / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: MOTION.glowPulse / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowRadius: glowRadius.value,
    shadowOpacity: glowRadius.value > 0 ? 0.8 : 0,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: MOTION.tap });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: MOTION.tap });
  };

  return (
    <Animated.View style={[{ borderRadius: height / 2 }, glowStyle, { shadowColor: KS.primary, shadowOffset: { width: 0, height: 0 } }, style]}>
      <Animated.View style={[pressStyle, { borderRadius: height / 2, overflow: 'hidden' }]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={label}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <LinearGradient
            colors={['#1e90ff', '#007bff', '#0062cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.gradient, { height, borderRadius: height / 2, opacity: disabled ? 0.5 : 1 }]}
          >
            <Text style={[styles.label, { fontSize: SIZES.titleSm }]}>
              {label.toUpperCase()}
            </Text>
            {subLabel && (
              <Text style={styles.subLabel}>{subLabel.toUpperCase()}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    color: KS.ink,
    fontFamily: TYPO.display,
    letterSpacing: SIZES.titleSm * 0.06,
    textTransform: 'uppercase',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
    marginTop: 2,
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../stores/themeStore';
import { radius, motion, fontSize, fontWeight } from '../theme/tokens';
import { ThemedText } from './ThemedText';

interface AnimatedProgressBarProps {
  value: number;            // 0..1
  height?: number;
  showLabel?: boolean;
  label?: string;
  gradient?: [string, string];
  borderColor?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Smooth progress bar (XP, MMR-to-next-tier, etc.).
 * Width animates with `withTiming` whenever `value` changes.
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  height = 16,
  showLabel = false,
  label,
  gradient,
  borderColor,
  trackColor,
  style,
}) => {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, value)), {
      duration: motion.slow,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [value, progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: trackColor ?? theme.colors.surface,
          borderColor: borderColor ?? theme.colors.border,
          borderWidth: 1,
          borderRadius: radius.pill,
          overflow: 'hidden',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={gradient ?? [theme.colors.primary, theme.colors.reward]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {showLabel && (
        <ThemedText
          style={{ textAlign: 'center', fontSize: fontSize.xs, fontWeight: fontWeight.bold as '700', zIndex: 2 }}
          color={theme.colors.text}
        >
          {label ?? `${Math.round(value * 100)}%`}
        </ThemedText>
      )}
    </View>
  );
};

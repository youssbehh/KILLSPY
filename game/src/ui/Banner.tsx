import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../stores/themeStore';
import { radius, spacing, fontSize, fontWeight, motion } from '../theme/tokens';
import { ThemedText } from './ThemedText';

interface BannerProps {
  variant: 'victory' | 'defeat' | 'draw';
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Heraldic victory / defeat banner shown after a match.
 * Drops in with a spring-y entrance and stays static after.
 */
export const Banner: React.FC<BannerProps> = ({ variant, title, subtitle, children, style }) => {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.normal });
    scale.value = withSequence(
      withTiming(1.15, { duration: motion.normal, easing: Easing.out(Easing.back(1.6)) }),
      withDelay(80, withTiming(1, { duration: motion.fast })),
    );
  }, [opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const palette = {
    victory: { from: '#FFD700', to: '#FFA500', ribbon: '#C8102E', text: '#7B5500', label: title ?? 'VICTORY' },
    defeat:  { from: '#7B5500', to: '#3D2A00', ribbon: '#8B0000', text: '#FFE4B5', label: title ?? 'DEFEAT'  },
    draw:    { from: '#9FA8DA', to: '#3F51B5', ribbon: '#283593', text: '#E3F2FD', label: title ?? 'MATCH NUL' },
  }[variant];

  return (
    <Animated.View style={[styles.wrapper, animStyle, style]}>
      <View style={styles.shieldShadow} />
      <LinearGradient
        colors={[palette.from, palette.to]}
        style={styles.shield}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={[styles.ribbon, { backgroundColor: palette.ribbon }]} pointerEvents="none">
          <ThemedText style={styles.ribbonText} color="#ffffff">
            {palette.label}
          </ThemedText>
        </View>
        <View style={styles.shieldContent}>
          {subtitle && (
            <ThemedText style={styles.subtitle} color={palette.text}>
              {subtitle}
            </ThemedText>
          )}
          {children}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', padding: spacing.lg },
  shieldShadow: {
    position: 'absolute', top: 12, left: '50%',
    width: 220, marginLeft: -110,
    height: 240,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.lg,
    transform: [{ scaleY: 0.9 }],
  },
  shield: {
    width: 220,
    minHeight: 240,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    top: 18,
    left: -8, right: -8,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  ribbonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black as '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  shieldContent: { marginTop: spacing.md, alignItems: 'center', gap: spacing.sm },
  subtitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as '600', textAlign: 'center' },
});

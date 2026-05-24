import React from 'react';
import { Pressable, StyleSheet, View, PressableProps, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../stores/themeStore';
import { radius, spacing, stickerRelief, fontSize, fontWeight, motion } from '../theme/tokens';
import { ThemedText } from './ThemedText';

type Variant = 'primary' | 'reward' | 'danger' | 'info' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface StickerButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shine?: boolean; // adds a diagonal highlight
}

/**
 * 3D "sticker" button — the staple of the new gamefeel.
 * Bottom darker edge + scale-on-press + optional gradient fill.
 *
 * Variants map to theme tokens:
 *  - primary → mint (positive actions: PLAY, EQUIP, CLAIM)
 *  - reward  → gold (XP, rewards, shop "buy")
 *  - danger  → red (delete, leave game)
 *  - info    → cyan (secondary CTA)
 *  - ghost   → transparent with outline (cancel)
 */
export const StickerButton: React.FC<StickerButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  shine = true,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const press = useSharedValue(0);

  const variantPalette = {
    primary: { bg: theme.colors.primary, edge: theme.colors.primaryDark, fg: theme.colors.primaryText, gradient: ['#4FFFB0', theme.colors.primaryDark] as [string, string] },
    reward:  { bg: theme.colors.reward,  edge: theme.colors.rewardDark,  fg: '#1a1a1a',                 gradient: ['#FFE066', theme.colors.rewardDark]  as [string, string] },
    danger:  { bg: theme.colors.danger,  edge: theme.colors.dangerDark,  fg: '#ffffff',                 gradient: ['#FF6B6B', theme.colors.dangerDark]  as [string, string] },
    info:    { bg: theme.colors.info,    edge: theme.colors.infoDark,    fg: '#ffffff',                 gradient: ['#5BE0FF', theme.colors.infoDark]    as [string, string] },
    ghost:   { bg: 'transparent',        edge: 'transparent',            fg: theme.colors.primary,      gradient: undefined as unknown as [string, string] },
  }[variant];

  const sizeMap: Record<Size, { h: number; px: number; relief: number; fz: number }> = {
    sm: { h: 36, px: spacing.md, relief: stickerRelief.sm, fz: fontSize.sm },
    md: { h: 52, px: spacing.lg, relief: stickerRelief.md, fz: fontSize.md },
    lg: { h: 64, px: spacing.xl, relief: stickerRelief.lg, fz: fontSize.lg },
  };
  const sz = sizeMap[size];
  const isDisabled = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: press.value * (sz.relief - 1) }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.96, motion.spring);
    press.value = withSpring(1, motion.spring);
    onPressIn?.(e);
  };
  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, motion.spring);
    press.value = withSpring(0, motion.spring);
    onPressOut?.(e);
  };

  return (
    <View style={[fullWidth && { width: '100%' }, !fullWidth && { alignSelf: 'flex-start' }]}>
      {/* Bottom 3D edge */}
      {variant !== 'ghost' && (
        <View
          style={{
            position: 'absolute',
            left: 0, right: 0, top: sz.relief, bottom: -sz.relief,
            backgroundColor: variantPalette.edge,
            borderRadius: radius.lg,
          }}
        />
      )}
      <Animated.View style={animStyle}>
        <Pressable
          disabled={isDisabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...rest}
          style={({ pressed }) => [
            styles.base,
            {
              height: sz.h,
              paddingHorizontal: sz.px,
              borderRadius: radius.lg,
              opacity: isDisabled ? 0.55 : 1,
              borderWidth: variant === 'ghost' ? 2 : 0,
              borderColor: variant === 'ghost' ? theme.colors.primary : 'transparent',
              backgroundColor: variant === 'ghost' ? 'transparent' : undefined,
            },
          ]}
        >
          {variant !== 'ghost' && variantPalette.gradient && (
            <LinearGradient
              colors={variantPalette.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          {shine && variant !== 'ghost' && (
            <View pointerEvents="none" style={styles.shine} />
          )}
          <View style={styles.row}>
            {loading ? (
              <ActivityIndicator color={variantPalette.fg} style={{ marginRight: spacing.sm }} />
            ) : leftIcon ? (
              <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>
            ) : null}
            <ThemedText
              variant="body"
              color={variantPalette.fg}
              style={{ fontWeight: fontWeight.bold as '700', fontSize: sz.fz, letterSpacing: 0.5 }}
            >
              {label}
            </ThemedText>
            {rightIcon ? <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View> : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  shine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
});

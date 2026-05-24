import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ImageSourcePropType, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../stores/themeStore';
import { motion } from '../theme/tokens';

interface MascotDisplayProps {
  source?: ImageSourcePropType;
  size?: number;
  floating?: boolean;          // idle bobbing animation
  haloColor?: string;
  showPlatform?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hero zone for the spy mascot — image with halo light, optional floor disc
 * and a slow idle bobbing animation.
 */
export const MascotDisplay: React.FC<MascotDisplayProps> = ({
  source,
  size = 220,
  floating = true,
  haloColor,
  showPlatform = true,
  style,
}) => {
  const theme = useTheme();
  const bob = useSharedValue(0);
  const halo = haloColor ?? theme.colors.glow;

  useEffect(() => {
    if (!floating) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [floating, bob]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }, style]}>
      {/* Halo radial light */}
      <View
        style={[
          styles.halo,
          {
            shadowColor: halo,
            backgroundColor: 'transparent',
          },
        ]}
      />
      <LinearGradient
        colors={[`${halo}55`, 'transparent']}
        style={styles.haloGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* Mascot */}
      <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animStyle]}>
        {source ? (
          <Image source={source} style={{ width: size * 0.85, height: size * 0.85 }} resizeMode="contain" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderStrong, width: size * 0.85, height: size * 0.85 }]} />
        )}
      </Animated.View>

      {/* Floor platform disc */}
      {showPlatform && (
        <View
          style={[
            styles.platform,
            {
              width: size * 0.7,
              borderColor: theme.colors.borderStrong,
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    top: '20%', left: '20%',
    width: '60%', height: '60%',
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 10,
  },
  haloGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 200,
    opacity: 0.7,
  },
  placeholder: {
    borderRadius: 999,
    borderWidth: 2,
  },
  platform: {
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.6,
    marginTop: -8,
  },
});

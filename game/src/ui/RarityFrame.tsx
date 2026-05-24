import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RARITIES, RarityId } from '../game/rarities';
import { radius } from '../theme/tokens';

interface RarityFrameProps {
  rarity: RarityId;
  children: React.ReactNode;
  size?: number;
  shape?: 'square' | 'round';
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Coloured frame wrapping an item icon / avatar, with optional glow halo.
 * Uses RARITIES tokens (common → secret).
 */
export const RarityFrame: React.FC<RarityFrameProps> = ({
  rarity,
  children,
  size = 80,
  shape = 'square',
  glow = true,
  style,
}) => {
  const r = RARITIES[rarity];
  const borderRadius = shape === 'round' ? size / 2 : radius.lg;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          padding: 3,
        },
        glow && {
          shadowColor: r.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.95,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[r.color, r.glow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        style={[
          styles.inner,
          { borderRadius: borderRadius - 3, backgroundColor: '#0d1929' },
        ]}
      >
        {children}
      </View>
      {rarity === 'secret' && (
        <View style={[StyleSheet.absoluteFill, styles.starOverlay]} pointerEvents="none">
          <View style={[styles.star, { top: '15%', left: '15%' }]} />
          <View style={[styles.star, { top: '20%', right: '20%', width: 6, height: 6 }]} />
          <View style={[styles.star, { bottom: '20%', left: '25%', width: 5, height: 5 }]} />
          <View style={[styles.star, { bottom: '15%', right: '15%' }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starOverlay: { pointerEvents: 'none' },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    opacity: 0.7,
  },
});

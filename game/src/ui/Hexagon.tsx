import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../stores/themeStore';

interface HexagonProps {
  size?: number;
  color?: string;
  gradient?: [string, string];
  borderColor?: string;
  borderWidth?: number;
  glow?: boolean;
  glowColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pointy-top hexagon used for avatars, ranks, level badges.
 * Renders an SVG shape with optional gradient fill, outline and glow halo,
 * and absolutely positions `children` (icon, text, image) on top.
 */
export const Hexagon: React.FC<HexagonProps> = ({
  size = 64,
  color,
  gradient,
  borderColor,
  borderWidth = 2,
  glow = false,
  glowColor,
  children,
  style,
}) => {
  const theme = useTheme();
  const fill = color ?? theme.colors.surface;
  const stroke = borderColor ?? theme.colors.borderStrong;
  const haloColor = glowColor ?? theme.colors.glow;
  const gradId = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  const w = size;
  const h = size * 0.866 * 2 / Math.sqrt(3); // pointy-top ratio
  // Points for a pointy-top hex within (size × size) viewBox
  const points = [
    [w * 0.5, 0],
    [w, h * 0.25],
    [w, h * 0.75],
    [w * 0.5, h],
    [0, h * 0.75],
    [0, h * 0.25],
  ].map((p) => p.join(',')).join(' ');

  return (
    <View
      style={[
        { width: size, height: h },
        glow && {
          shadowColor: haloColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 16,
          elevation: 12,
        },
        style,
      ]}
    >
      <Svg width={size} height={h} viewBox={`0 0 ${w} ${h}`}>
        {gradient && (
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
        )}
        <Polygon
          points={points}
          fill={gradient ? `url(#${gradId})` : fill}
          stroke={stroke}
          strokeWidth={borderWidth}
          strokeLinejoin="round"
        />
      </Svg>
      {children ? (
        <View style={[StyleSheet.absoluteFillObject, styles.center]} pointerEvents="none">
          {children}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});

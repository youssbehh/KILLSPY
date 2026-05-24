import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Pattern,
  Rect,
  Path,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';

interface Props {
  showRadar?: boolean;
  radarDuration?: number;
  intensity?: number;
}

export const TopoBg: React.FC<Props> = ({
  showRadar = false,
  radarDuration = 6000,
  intensity = 1,
}) => {
  const { width, height } = useWindowDimensions();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!showRadar) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: radarDuration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [showRadar, radarDuration]);

  const radarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const blobOpacity = intensity * 0.12;
  const topoOpacity = intensity * 0.05;
  const dotOpacity = intensity * 0.05;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Layer 1: solid bg */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: KS.bg }]} />

      {/* Layer 2: dot grid */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <Pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <Circle cx="1" cy="1" r="0.5" fill={`rgba(255,255,255,${dotOpacity})`} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#dots)" />
      </Svg>

      {/* Layer 3: radial glow blobs */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="blob1" cx="22%" cy="18%" r="35%">
            <Stop offset="0" stopColor={KS.primary} stopOpacity={String(blobOpacity)} />
            <Stop offset="1" stopColor={KS.primary} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blob2" cx="88%" cy="92%" r="35%">
            <Stop offset="0" stopColor={KS.primary} stopOpacity={String(blobOpacity * 0.7)} />
            <Stop offset="1" stopColor={KS.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#blob1)" />
        <Rect width={width} height={height} fill="url(#blob2)" />
      </Svg>

      {/* Layer 4: topographic rings */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="topo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <Circle cx="60" cy="60" r="50" stroke={`rgba(255,255,255,${topoOpacity})`} strokeWidth="1" fill="none" />
            <Circle cx="60" cy="60" r="35" stroke={`rgba(255,255,255,${topoOpacity})`} strokeWidth="1" fill="none" />
            <Circle cx="60" cy="60" r="18" stroke={`rgba(255,255,255,${topoOpacity})`} strokeWidth="1" fill="none" />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#topo)" />
      </Svg>

      {/* Radar sweep overlay */}
      {showRadar && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
            radarStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient id="sweep" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={KS.live} stopOpacity="0.18" />
                <Stop offset="1" stopColor={KS.live} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* 70-degree sweep wedge approximated with a filled path */}
            <Path
              d={`M${width/2},${height/2} L${width/2},0 Q${width * 0.85},${height * 0.1} ${width},${height/2} Z`}
              fill={`rgba(57,255,20,0.08)`}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

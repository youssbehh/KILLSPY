import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, {
  Polygon,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  ClipPath,
  Image as SvgImage,
} from 'react-native-svg';
import { KS, TierName } from '../../theme/colors';
import { TYPO } from '../../theme/typography';

interface Props {
  size?: number;
  tier?: TierName;
  src?: string;
  initials?: string;
  live?: boolean;
}

// Hex polygon points for a given bounding box
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // flat-top hex: 0°, 60°, 120°, 180°, 240°, 300°
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

export const HexAvatar: React.FC<Props> = ({
  size = 56,
  tier = 'gold',
  src,
  initials = 'X',
  live = false,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size / 2 - 1;
  const cutR = ringR - 3;
  const innerR = cutR - 2;
  const tierColor = KS.tier[tier];
  const liveDotSize = 12;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Tier ring gradient */}
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tierColor} />
            <Stop offset="0.35" stopColor="#ffffff" />
            <Stop offset="0.7" stopColor={tierColor} />
            <Stop offset="1" stopColor="#000000" />
          </LinearGradient>

          {/* Avatar background gradient */}
          <LinearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={KS.surfaceHi} />
            <Stop offset="1" stopColor={KS.surface} />
          </LinearGradient>

          {/* Hex clip for inner content */}
          <ClipPath id="hexClip">
            <Polygon points={hexPoints(cx, cy, innerR)} />
          </ClipPath>
        </Defs>

        {/* Ring */}
        <Polygon
          points={hexPoints(cx, cy, ringR)}
          fill="url(#ring)"
        />

        {/* Dark bg cutout */}
        <Polygon
          points={hexPoints(cx, cy, cutR)}
          fill={KS.bg}
        />

        {/* Inner avatar background */}
        <Polygon
          points={hexPoints(cx, cy, innerR)}
          fill="url(#avatarBg)"
        />

        {/* Avatar image if provided */}
        {src && (
          <SvgImage
            href={{ uri: src }}
            x={cx - innerR}
            y={cy - innerR}
            width={innerR * 2}
            height={innerR * 2}
            clipPath="url(#hexClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
      </Svg>

      {/* Initials overlay when no image */}
      {!src && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
          ]}
          pointerEvents="none"
        >
          <Text
            style={{
              color: KS.ink,
              fontFamily: TYPO.display,
              fontSize: size * 0.32,
              letterSpacing: size * 0.32 * 0.04,
            }}
          >
            {initials.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Live dot */}
      {live && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: size * 0.1,
            width: liveDotSize,
            height: liveDotSize,
            borderRadius: liveDotSize / 2,
            backgroundColor: KS.live,
            borderWidth: 2,
            borderColor: KS.bg,
            shadowColor: KS.live,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      )}
    </View>
  );
};

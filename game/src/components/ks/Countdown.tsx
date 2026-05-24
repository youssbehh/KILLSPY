import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  value: number;   // seconds remaining
  max?: number;
}

const SIZE = 132;
const RADIUS = 60;
const STROKE_W = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function urgencyColor(v: number): string {
  if (v <= 2) return KS.danger;
  if (v === 3) return KS.alert;
  return KS.live;
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }).map((_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

export const Countdown: React.FC<Props> = ({ value, max = 5 }) => {
  const dashOffset = useSharedValue((1 - value / max) * CIRCUMFERENCE);
  const blinkOp = useSharedValue(1);
  const color = urgencyColor(value);
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  useEffect(() => {
    dashOffset.value = withTiming(
      (1 - value / max) * CIRCUMFERENCE,
      { duration: 800, easing: Easing.linear },
    );
    if (value <= 2) {
      blinkOp.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 250 }),
          withTiming(1,   { duration: 250 }),
        ),
        -1,
        false,
      );
    } else {
      blinkOp.value = withTiming(1, { duration: 100 });
    }
  }, [value]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOp.value,
  }));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="hexFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={KS.surfaceHi} />
            <Stop offset="1" stopColor={KS.surface} />
          </LinearGradient>
        </Defs>

        {/* Track ring */}
        <Circle cx={cx} cy={cy} r={RADIUS}
          stroke={KS.hairSoft} strokeWidth={STROKE_W} fill="none" />

        {/* Animated progress ring */}
        <AnimatedCircle
          cx={cx} cy={cy} r={RADIUS}
          stroke={color} strokeWidth={STROKE_W} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* Tick marks: 12 marks every 30° */}
        {Array.from({ length: 12 }).map((_, i) => {
          const big = i % 3 === 0;
          const angle = (i * 30 - 90) * Math.PI / 180;
          const outerR = RADIUS + STROKE_W + 8;
          const innerR = outerR - (big ? 6 : 3);
          return (
            <Line key={i}
              x1={cx + innerR * Math.cos(angle)}
              y1={cy + innerR * Math.sin(angle)}
              x2={cx + outerR * Math.cos(angle)}
              y2={cy + outerR * Math.sin(angle)}
              stroke={color}
              strokeOpacity={big ? 0.7 : 0.35}
              strokeWidth={big ? 2 : 1}
            />
          );
        })}

        {/* Inner hex */}
        <Polygon
          points={hexPoints(cx, cy, 42)}
          fill="url(#hexFill)"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      </Svg>

      {/* Center content */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, blinkStyle]}>
        <Text style={[styles.number, { color }]}>{value}</Text>
        <Text style={styles.sec}>SEC</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  center: { alignItems: 'center', justifyContent: 'center' },
  number: {
    fontFamily: TYPO.monoBold,
    fontSize: 46,
    lineHeight: 50,
    includeFontPadding: false,
  },
  sec: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Line,
  Defs,
  RadialGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { MOTION } from '../theme/motion';
import { TopoBg } from '../components/ks/TopoBg';
import { PlayerTag } from '../components/ks/PlayerTag';
import { GlassCard } from '../components/ks/GlassCard';
import { DangerButton } from '../components/ks/DangerButton';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useMyStats } from '../hooks/useGames';
import { rankTierIndex } from '../game/rankDisplay';

interface Props {
  /** Leaves the queue (or the pending match) and goes back. */
  onAbort: () => void;
}

const RADAR_SIZE = 300;
const RADAR_R = 140;

// Blips scattered around the radar
const BLIPS = [
  { angle: 40,  r: 90,  opacity: 1 },
  { angle: 125, r: 60,  opacity: 0.6 },
  { angle: 220, r: 110, opacity: 1 },
  { angle: 310, r: 75,  opacity: 0.6 },
];

export const MatchmakingScreen: React.FC<Props> = ({ onAbort }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT');
  const mmr = useAuthStore((s) => s.user?.mmr ?? 0);
  const matchStatus = useGameStore((s) => s.matchStatus);
  const mode = useGameStore((s) => s.mode);
  const opponent = useGameStore((s) => s.opponent);
  const queueSize = useGameStore((s) => s.queueSize);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const { data: myStats } = useMyStats();

  const found = matchStatus === 'countdown';
  const modeStats = mode === 'pvp_ranked' ? myStats?.stats.ranked : myStats?.stats.quick;
  const winRate = modeStats && modeStats.total > 0 ? Math.round(modeStats.winRate * 100) : undefined;
  const totalMatches = (myStats?.stats.quick.total ?? 0) + (myStats?.stats.ranked.total ?? 0);

  const [elapsed, setElapsed] = useState(0);
  const sweepRotation = useSharedValue(0);
  const pingScale = useSharedValue(1);
  const blinkOpacity = useSharedValue(1);

  useEffect(() => {
    // Radar sweep
    sweepRotation.value = withRepeat(
      withTiming(360, { duration: MOTION.radar, easing: Easing.linear }),
      -1,
      false,
    );

    // Center pulse
    pingScale.value = withRepeat(
      withSequence(
        withTiming(2.8, { duration: 1600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );

    // Amber dot blink
    blinkOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );

    // Elapsed timer
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweepRotation.value}deg` }],
  }));

  const pingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pingScale.value }],
    opacity: 2 - pingScale.value * 0.6,
  }));

  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  const cx = RADAR_SIZE / 2;
  const cy = RADAR_SIZE / 2;
  const elapsedStr = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <TopoBg />

      {/* Eyebrow */}
      <View style={[styles.eyebrow, { paddingTop: insets.top + 16 }]}>
        <View style={styles.eyebrowRow}>
          <Animated.Text style={[styles.eyebrowLive, blinkStyle]}>●</Animated.Text>
          <Text style={styles.eyebrowLive}>
            {' '}{mode === 'pvp_ranked' ? 'RANKED' : mode === 'pvp_friendly' ? 'FRIENDLY DUEL' : 'QUICK PLAY'} · {elapsedStr}
          </Text>
        </View>
        <Text style={styles.title}>{found ? 'TARGET ACQUIRED' : 'SEARCHING FOR TARGET'}</Text>
        <Text style={[styles.subtitle, errorMessage ? { color: KS.danger } : null]}>
          {errorMessage ?? (found ? `VS ${opponent?.username.toUpperCase() ?? 'UNKNOWN'} · GET READY` : 'ENCRYPTED CHANNEL OPEN')}
        </Text>
      </View>

      {/* Radar */}
      <View style={[styles.radar, { marginTop: 168 }]}>
        <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
          <Defs>
            <RadialGradient id="radarBg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={KS.primary} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={KS.bg} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background fill */}
          <Circle cx={cx} cy={cy} r={RADAR_R} fill="url(#radarBg)" />

          {/* Concentric rings */}
          {[140, 100, 60, 24].map((r, i) => (
            <Circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              stroke={KS.primary}
              strokeOpacity={0.18 - i * 0.03}
              strokeWidth={1}
              fill="none"
            />
          ))}

          {/* Crosshairs */}
          <Line x1={cx} y1={cy - RADAR_R} x2={cx} y2={cy + RADAR_R}
            stroke={KS.primary} strokeOpacity="0.18" strokeWidth={1} strokeDasharray="4,4" />
          <Line x1={cx - RADAR_R} y1={cy} x2={cx + RADAR_R} y2={cy}
            stroke={KS.primary} strokeOpacity="0.18" strokeWidth={1} strokeDasharray="4,4" />

          {/* Compass */}
          {['N','E','S','W'].map((label, i) => {
            const angle = i * 90;
            const rad = (angle - 90) * Math.PI / 180;
            const lx = cx + 152 * Math.cos(rad);
            const ly = cy + 152 * Math.sin(rad);
            return (
              <SvgText key={label} x={lx} y={ly + 3}
                textAnchor="middle" fontSize="9"
                fill={KS.inkDim} fontFamily={TYPO.mono}>
                {label}
              </SvgText>
            );
          })}

          {/* Amber blips */}
          {BLIPS.map((b, i) => {
            const rad = (b.angle - 90) * Math.PI / 180;
            const bx = cx + b.r * Math.cos(rad);
            const by = cy + b.r * Math.sin(rad);
            return (
              <Circle key={i} cx={bx} cy={by} r={3}
                fill={KS.alert} opacity={b.opacity} />
            );
          })}
        </Svg>

        {/* Sweep overlay (rotates) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, sweepStyle]}
          pointerEvents="none"
        >
          <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
            {/* Sweep wedge: roughly 70° arc from the top */}
            <G origin={`${cx}, ${cy}`}>
              {Array.from({ length: 35 }).map((_, i) => {
                const deg = i * 2 - 35;
                const rad = (deg - 90) * Math.PI / 180;
                return (
                  <Line
                    key={i}
                    x1={cx} y1={cy}
                    x2={cx + RADAR_R * Math.cos(rad)}
                    y2={cy + RADAR_R * Math.sin(rad)}
                    stroke={KS.live}
                    strokeOpacity={0.007 * (35 - i)}
                    strokeWidth={4}
                  />
                );
              })}
            </G>
          </Svg>
        </Animated.View>

        {/* Center ping */}
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          {/* Expanding ring */}
          <Animated.View style={[styles.pingRing, pingStyle]} />
          {/* Solid dot */}
          <View style={styles.pingDot} />
        </View>
      </View>

      {/* Player card preview */}
      <View style={{ marginTop: 484 - 168 - RADAR_SIZE, paddingHorizontal: 16, position: 'absolute', top: 484, left: 0, right: 0 }}>
        <GlassCard width={width - 32} height={88} chamfer={10} variant="tr-bl">
          <View style={styles.playerCardInner}>
            <PlayerTag username={username.toUpperCase()} tier={rankTierIndex(mmr)} live size="big" winRate={winRate} />
            <View style={styles.matchStats}>
              <Text style={styles.matchStatLabel}>MATCHES</Text>
              <Text style={styles.matchStatValue}>{totalMatches}</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Hint band */}
      <Text style={styles.hint}>
        › {found ? 'MATCH STARTING' : `AGENTS IN QUEUE: ${Math.max(1, queueSize)}`}
      </Text>

      {/* Abort button */}
      <DangerButton
        label="ABORT MISSION"
        onPress={onAbort}
        style={styles.abort}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  eyebrow: { paddingHorizontal: 16, gap: 4, alignItems: 'flex-start' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center' },
  eyebrowLive: {
    color: KS.alert,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: 26,
    letterSpacing: 26 * 0.04,
  },
  subtitle: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  radar: {
    position: 'absolute',
    left: '50%',
    marginLeft: -RADAR_SIZE / 2,
  },
  pingRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: KS.live,
  },
  pingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: KS.live,
    shadowColor: KS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 4,
  },
  playerCardInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  matchStats: { alignItems: 'flex-end', gap: 2 },
  matchStatLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  matchStatValue: {
    color: KS.ink,
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.titleMd,
  },
  hint: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  abort: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
});

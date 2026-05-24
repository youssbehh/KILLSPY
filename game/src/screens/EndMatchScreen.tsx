import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { MOTION } from '../theme/motion';
import { TopoBg } from '../components/ks/TopoBg';
import { GlassCard } from '../components/ks/GlassCard';
import { ChamferContainer } from '../components/ks/ChamferContainer';
import { PrimaryButton } from '../components/ks/PrimaryButton';
import { SecondaryButton } from '../components/ks/SecondaryButton';
import { ProgressBar } from '../components/ks/ProgressBar';

export type MatchOutcome = 'won' | 'lost';

interface StatPod {
  label: string;
  value: string;
  color: string;
}

interface Props {
  outcome: MatchOutcome;
  xpEarned?: number;
  rpDelta?: number;
  stats?: StatPod[];
  onContinue?: () => void;
  onRematch?: () => void;
  onHome?: () => void;
}

export const EndMatchScreen: React.FC<Props> = ({
  outcome = 'won',
  xpEarned = outcome === 'won' ? 1840 : 420,
  rpDelta = outcome === 'won' ? 28 : -15,
  stats = DEFAULT_STATS,
  onContinue,
  onRematch,
  onHome,
}) => {
  const { width } = useWindowDimensions();
  const win = outcome === 'won';
  const accent = win ? KS.alert : KS.danger;

  const stampScale = useSharedValue(2.2);
  const stampRotate = useSharedValue(-14);
  const stampOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Stamp in
    stampOpacity.value = withTiming(1, { duration: 100 });
    stampScale.value = withTiming(1, {
      duration: MOTION.stampIn,
      easing: Easing.out(Easing.back(1.5)),
    });
    stampRotate.value = withTiming(-5, {
      duration: MOTION.stampIn,
      easing: Easing.out(Easing.back(1.5)),
    });

    // Content fades in
    contentOpacity.value = withDelay(
      MOTION.stampIn + 100,
      withTiming(1, { duration: 300 }),
    );
  }, []);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [
      { scale: stampScale.value },
      { rotate: `${stampRotate.value}deg` },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const PAD = 16;
  const cardWidth = width - PAD * 2;

  return (
    <View style={styles.container}>
      <TopoBg />

      {/* Background gradient tint */}
      <LinearGradient
        colors={[
          win ? 'rgba(255,193,7,0.08)' : 'rgba(255,59,48,0.08)',
          'transparent',
        ]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Eyebrow */}
        <Text style={styles.eyebrow}>
          // DEBRIEF · OP NIGHTFALL{!win ? ' · REDACTED' : ''}
        </Text>

        {/* Stamp */}
        <View style={styles.stampWrapper}>
          <Animated.View style={[styles.stampContainer, { borderColor: accent, shadowColor: accent }, stampStyle]}>
            <Text style={[styles.stampTitle, { color: accent }]}>
              {win ? 'MISSION COMPLETE' : 'MISSION FAILED'}
            </Text>
            <Text style={styles.stampSub}>
              {win
                ? 'TARGET ELIMINATED · OBJECTIVE SECURED'
                : 'AGENT KIA · INTEL COMPROMISED'}
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[contentStyle, { gap: 12 }]}>
          {/* XP Card */}
          <GlassCard width={cardWidth} height={132} chamfer={10} variant="tr-bl">
            <View style={styles.xpInner}>
              <View style={styles.xpLeft}>
                <Text style={styles.xpLabel}>XP EARNED</Text>
                <Text style={[styles.xpValue, { color: win ? KS.live : KS.inkMute }]}>
                  +{xpEarned.toLocaleString('en-US')}
                </Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.rankProgress}>RANK PROGRESS · AGENT III</Text>
                <Text style={[styles.rpDelta, { color: win ? KS.live : KS.danger }]}>
                  {rpDelta > 0 ? '+' : ''}{rpDelta} RP
                </Text>
                <ProgressBar value={win ? 0.65 : 0.35} segments={26} color={accent} height={6} />
              </View>
            </View>
          </GlassCard>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <ChamferContainer
                key={s.label}
                width={(cardWidth - 8) / 2}
                height={80}
                chamfer={8}
                variant="tr-bl"
                fill={KS.surface}
                stroke={KS.hairSoft}
              >
                <View style={styles.statPodInner}>
                  {/* Colored top stripe */}
                  <View style={[styles.statStripe, { backgroundColor: s.color }]} />
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                </View>
              </ChamferContainer>
            ))}
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <PrimaryButton
              label={win ? 'CONTINUE' : 'REMATCH'}
              onPress={win ? onContinue : onRematch}
              size="large"
            />
            <View style={styles.ctaRow}>
              <SecondaryButton label="REPLAY" onPress={() => {}} style={{ flex: 1 }} />
              <SecondaryButton label="HOME" onPress={onHome} style={{ flex: 1 }} />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const DEFAULT_STATS: StatPod[] = [
  { label: 'KILLS',    value: '3',    color: KS.danger },
  { label: 'DEATHS',   value: '1',    color: KS.enemy  },
  { label: 'ACCURACY', value: '75%',  color: KS.primary },
  { label: 'MVP',      value: '★',    color: KS.alert   },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { paddingTop: 64, gap: 0 },
  eyebrow: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
    marginBottom: 16,
  },
  stampWrapper: {
    alignItems: 'center',
    height: 110,
    justifyContent: 'center',
    marginBottom: 20,
  },
  stampContainer: {
    borderWidth: 3,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  stampTitle: {
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.06,
  },
  stampSub: {
    color: KS.inkMute,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
    marginTop: 4,
  },
  xpInner: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  xpLeft: { alignItems: 'flex-start', gap: 4 },
  xpLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  xpValue: {
    fontFamily: TYPO.monoBold,
    fontSize: 32,
  },
  xpRight: { flex: 1, gap: 4 },
  rankProgress: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  rpDelta: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoLg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statPodInner: { flex: 1, padding: 10, gap: 4 },
  statStripe: { height: 2, borderRadius: 1, marginBottom: 4 },
  statLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  statValue: {
    fontFamily: TYPO.monoBold,
    fontSize: 24,
  },
  ctas: { gap: 8, marginTop: 8 },
  ctaRow: { flexDirection: 'row', gap: 8 },
});

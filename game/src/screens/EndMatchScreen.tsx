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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../stores/authStore';
import { GameMode, mmrToRank, progressToNext } from '../game/ranking';

interface StatPod {
  label: string;
  value: string;
  color: string;
}

export type MatchOutcome = 'won' | 'lost' | 'draw' | 'opponent_forfeit';

interface Props {
  outcome: MatchOutcome;
  /** 'pve' for training games against the bot (nothing is credited). */
  mode: GameMode;
  /** What the server credited. Null for training games. */
  rewards?: { mmrDelta: number; moneyDelta: number } | null;
  rounds: number;
  livesLeft: number;
  onRematch?: () => void;
  onHome?: () => void;
}

const MODE_LABEL: Record<GameMode, string> = {
  pve: 'TRAINING',
  pvp_quick: 'QUICK PLAY',
  pvp_ranked: 'RANKED',
};

const HEADLINE: Record<MatchOutcome, { title: string; sub: string }> = {
  won: { title: 'MISSION COMPLETE', sub: 'TARGET ELIMINATED · OBJECTIVE SECURED' },
  opponent_forfeit: { title: 'MISSION COMPLETE', sub: 'TARGET FLED THE FIELD' },
  draw: { title: 'STALEMATE', sub: 'BOTH AGENTS DOWN' },
  lost: { title: 'MISSION FAILED', sub: 'AGENT KIA · INTEL COMPROMISED' },
};

export const EndMatchScreen: React.FC<Props> = ({
  outcome,
  mode,
  rewards,
  rounds,
  livesLeft,
  onRematch,
  onHome,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mmr = useAuthStore((s) => s.user?.mmr ?? 0);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const win = outcome === 'won' || outcome === 'opponent_forfeit';
  const draw = outcome === 'draw';
  const accent = win ? KS.alert : draw ? KS.primary : KS.danger;
  const headline = HEADLINE[outcome];

  const coins = rewards?.moneyDelta ?? 0;
  const rpDelta = rewards?.mmrDelta ?? 0;
  const ranked = mode === 'pvp_ranked';
  const rank = mmrToRank(mmr);

  const stats: StatPod[] = [
    { label: 'MODE', value: MODE_LABEL[mode], color: KS.primary },
    { label: 'ROUNDS', value: String(rounds), color: KS.ink },
    { label: 'LIVES LEFT', value: String(livesLeft), color: livesLeft > 0 ? KS.live : KS.danger },
    { label: 'RANK', value: rank.label.toUpperCase(), color: KS.alert },
  ];

  const stampScale = useSharedValue(2.2);
  const stampRotate = useSharedValue(-14);
  const stampOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(
      win ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});

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

  const rewardNote =
    mode === 'pve'
      ? 'TRAINING · NO REWARD'
      : isGuest
        ? 'GUEST ACCOUNT · NO REWARD'
        : ranked
          ? `RANK PROGRESS · ${rank.label.toUpperCase()}`
          : 'QUICK PLAY · NO RP';

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
        contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD, paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Eyebrow */}
        <Text style={styles.eyebrow}>
          // DEBRIEF · {MODE_LABEL[mode]}
        </Text>

        {/* Stamp */}
        <View style={styles.stampWrapper}>
          <Animated.View style={[styles.stampContainer, { borderColor: accent, shadowColor: accent }, stampStyle]}>
            <Text style={[styles.stampTitle, { color: accent }]}>{headline.title}</Text>
            <Text style={styles.stampSub}>{headline.sub}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[contentStyle, { gap: 12 }]}>
          {/* Rewards card */}
          <GlassCard width={cardWidth} height={132} chamfer={10} variant="tr-bl">
            <View style={styles.xpInner}>
              <View style={styles.xpLeft}>
                <Text style={styles.xpLabel}>COINS EARNED</Text>
                <Text style={[styles.xpValue, { color: coins > 0 ? KS.live : KS.inkMute }]}>
                  +{coins.toLocaleString('en-US')}
                </Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.rankProgress}>{rewardNote}</Text>
                {ranked && (
                  <Text style={[styles.rpDelta, { color: rpDelta >= 0 ? KS.live : KS.danger }]}>
                    {rpDelta > 0 ? '+' : ''}{rpDelta} RP
                  </Text>
                )}
                <ProgressBar value={progressToNext(mmr)} segments={26} color={accent} height={6} />
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
                  <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>
                    {s.value}
                  </Text>
                </View>
              </ChamferContainer>
            ))}
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <PrimaryButton label="REMATCH" onPress={onRematch} size="large" />
            <SecondaryButton label="HOME" onPress={onHome} />
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { gap: 0 },
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
});

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
import { levelFromXp, levelProgress } from '../game/progression';
import { useLocalT } from '../i18n/local';
import { useRankLabel } from '../game/displayNames';
import { Confetti } from '../components/ks/Confetti';

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
  rewards?: { mmrDelta: number; moneyDelta: number; xpDelta: number } | null;
  rounds: number;
  livesLeft: number;
  onRematch?: () => void;
  onHome?: () => void;
}

const STRINGS = {
  fr: {
    modeTraining: 'ENTRAÎNEMENT',
    modeQuick: 'PARTIE RAPIDE',
    modeRanked: 'CLASSÉE',
    modeFriendly: 'AMICALE',
    missionComplete: 'MISSION ACCOMPLIE',
    wonSub: 'CIBLE ÉLIMINÉE · OBJECTIF SÉCURISÉ',
    forfeitSub: 'LA CIBLE A FUI LE TERRAIN',
    stalemate: 'MATCH NUL',
    drawSub: 'LES DEUX AGENTS À TERRE',
    missionFailed: 'MISSION ÉCHOUÉE',
    lostSub: 'AGENT TOMBÉ · RENSEIGNEMENTS COMPROMIS',
    statMode: 'MODE',
    statRounds: 'MANCHES',
    statLives: 'VIES RESTANTES',
    statXp: 'XP GAGNÉE',
    noRewardTraining: 'ENTRAÎNEMENT · SANS RÉCOMPENSE',
    noRewardFriendly: 'AMICALE · SANS RÉCOMPENSE',
    noRewardGuest: 'COMPTE INVITÉ · SANS RÉCOMPENSE',
    rankProgress: 'PROGRESSION DU RANG · {rank}',
    levelXp: 'NIVEAU {level} · XP',
    debrief: '// DÉBRIEFING · {mode}',
    coinsEarned: 'PIÈCES GAGNÉES',
    rematch: 'REVANCHE',
    home: 'ACCUEIL',
  },
  en: {
    modeTraining: 'TRAINING',
    modeQuick: 'QUICK PLAY',
    modeRanked: 'RANKED',
    modeFriendly: 'FRIENDLY',
    missionComplete: 'MISSION COMPLETE',
    wonSub: 'TARGET ELIMINATED · OBJECTIVE SECURED',
    forfeitSub: 'TARGET FLED THE FIELD',
    stalemate: 'STALEMATE',
    drawSub: 'BOTH AGENTS DOWN',
    missionFailed: 'MISSION FAILED',
    lostSub: 'AGENT KIA · INTEL COMPROMISED',
    statMode: 'MODE',
    statRounds: 'ROUNDS',
    statLives: 'LIVES LEFT',
    statXp: 'XP EARNED',
    noRewardTraining: 'TRAINING · NO REWARD',
    noRewardFriendly: 'FRIENDLY · NO REWARD',
    noRewardGuest: 'GUEST ACCOUNT · NO REWARD',
    rankProgress: 'RANK PROGRESS · {rank}',
    levelXp: 'LEVEL {level} · XP',
    debrief: '// DEBRIEF · {mode}',
    coinsEarned: 'COINS EARNED',
    rematch: 'REMATCH',
    home: 'HOME',
  },
} as const;

type EndKey = keyof typeof STRINGS.fr;

const MODE_LABEL: Record<GameMode, EndKey> = {
  pve: 'modeTraining',
  pvp_quick: 'modeQuick',
  pvp_ranked: 'modeRanked',
  pvp_friendly: 'modeFriendly',
};

const HEADLINE: Record<MatchOutcome, { title: EndKey; sub: EndKey }> = {
  won: { title: 'missionComplete', sub: 'wonSub' },
  opponent_forfeit: { title: 'missionComplete', sub: 'forfeitSub' },
  draw: { title: 'stalemate', sub: 'drawSub' },
  lost: { title: 'missionFailed', sub: 'lostSub' },
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
  const t = useLocalT(STRINGS);
  const rankName = useRankLabel();
  const mmr = useAuthStore((s) => s.user?.mmr ?? 0);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const win = outcome === 'won' || outcome === 'opponent_forfeit';
  const draw = outcome === 'draw';
  const accent = win ? KS.alert : draw ? KS.primary : KS.danger;
  const headline = HEADLINE[outcome];

  const coins = rewards?.moneyDelta ?? 0;
  const rpDelta = rewards?.mmrDelta ?? 0;
  const xpDelta = rewards?.xpDelta ?? 0;
  const xp = useAuthStore((s) => s.user?.xp ?? 0);
  const ranked = mode === 'pvp_ranked';
  const rank = mmrToRank(mmr);

  const stats: StatPod[] = [
    { label: t('statMode'), value: t(MODE_LABEL[mode]), color: KS.primary },
    { label: t('statRounds'), value: String(rounds), color: KS.ink },
    { label: t('statLives'), value: String(livesLeft), color: livesLeft > 0 ? KS.live : KS.danger },
    { label: t('statXp'), value: `+${xpDelta}`, color: xpDelta > 0 ? KS.live : KS.inkMute },
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
      ? t('noRewardTraining')
      : mode === 'pvp_friendly'
        ? t('noRewardFriendly')
      : isGuest
        ? t('noRewardGuest')
        : ranked
          ? t('rankProgress', { rank: rankName(rank.id).toUpperCase() })
          : t('levelXp', { level: levelFromXp(xp) });

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
          {t('debrief', { mode: t(MODE_LABEL[mode]) })}
        </Text>

        {/* Stamp */}
        <View style={styles.stampWrapper}>
          <Animated.View style={[styles.stampContainer, { borderColor: accent, shadowColor: accent }, stampStyle]}>
            <Text style={[styles.stampTitle, { color: accent }]}>{t(headline.title)}</Text>
            <Text style={styles.stampSub}>{t(headline.sub)}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[contentStyle, { gap: 12 }]}>
          {/* Rewards card */}
          <GlassCard width={cardWidth} height={132} chamfer={10} variant="tr-bl">
            <View style={styles.xpInner}>
              <View style={styles.xpLeft}>
                <Text style={styles.xpLabel}>{t('coinsEarned')}</Text>
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
                <ProgressBar value={ranked ? progressToNext(mmr) : levelProgress(xp)} segments={26} color={accent} height={6} />
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
            {onRematch ? (
              <>
                <PrimaryButton label={t('rematch')} onPress={onRematch} size="large" />
                <SecondaryButton label={t('home')} onPress={onHome} />
              </>
            ) : (
              <PrimaryButton label={t('home')} onPress={onHome} size="large" />
            )}
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </Animated.View>
      </ScrollView>
      {/* A real victory only: a forfeit by the opponent wins, but is not celebrated. */}
      {outcome === 'won' && <Confetti />}
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

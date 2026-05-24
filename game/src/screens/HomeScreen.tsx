import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import {
  TopoBg,
  HexAvatar,
  RankBadge,
  GlassCard,
  ChamferContainer,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  Currency,
  NotificationPill,
  ProgressBar,
} from '../components/ks';
import { useAuthStore } from '../stores/authStore';

const PAD = 16;

export const HomeScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT_KILO');
  const cardWidth = width - PAD * 2;

  const handleQuickPlay = () => {
    router.push('/play/partieRapide');
  };

  const handleRanked = () => {
    router.push('/play/partieRapide');
  };

  return (
    <View style={styles.container}>
      <TopoBg />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <HexAvatar size={48} tier="gold" initials={username.slice(0, 2)} live />
            <View style={{ gap: 2 }}>
              <Text style={styles.agentName}>{username.toUpperCase()}</Text>
              <View style={styles.rankRow}>
                <RankBadge tier={2} size={18} />
                <Text style={styles.rankLabel}>AGENT · 1,847</Text>
              </View>
            </View>
          </View>
          <View style={styles.topRight}>
            <Currency kind="coin" value={4200} />
            <Currency kind="gem" value={84} />
            <NotificationPill count={3} />
          </View>
        </View>

        {/* ── Quick Play hero card ── */}
        <GlassCard
          width={cardWidth}
          height={168}
          chamfer={12}
          variant="tr-bl"
          style={{ marginTop: 12 }}
        >
          <View style={styles.quickPlayInner}>
            {/* Live indicator */}
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE · 24,387 AGENTS DEPLOYED</Text>
            </View>

            <Text style={styles.quickPlayTitle}>QUICK PLAY</Text>
            <Text style={styles.quickPlaySub}>4V4 · CASUAL · 2–5 MIN</Text>

            <PrimaryButton
              label="DEPLOY"
              subLabel="TAP TO DEPLOY"
              onPress={handleQuickPlay}
              size="large"
              style={{ marginTop: 8, alignSelf: 'stretch' }}
            />
          </View>
        </GlassCard>

        {/* ── Ranked Ops card ── */}
        <Pressable onPress={handleRanked} style={{ marginTop: 8 }}>
          <ChamferContainer
            width={cardWidth}
            height={92}
            chamfer={10}
            variant="tl-br"
            fill={KS.surface}
            stroke={KS.hairSoft}
          >
            {/* Amber left edge stripe */}
            <LinearGradient
              colors={[KS.alert, KS.tier.diamond]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.rankedStripe}
            />
            <View style={styles.rankedInner}>
              <View style={styles.rankedLeft}>
                <View style={styles.rankedTitleRow}>
                  <RankBadge tier={3} size={28} />
                  <Text style={styles.rankedTitle}>RANKED OPS</Text>
                </View>
                <Text style={styles.rankedSeason}>SEASON 02 · ENDS IN 18D 04H</Text>
                <Text style={[styles.rankedRp, { color: KS.tier.diamond }]}>
                  +28 RP TO NEXT TIER
                </Text>
              </View>
              <Text style={[styles.chevron, { color: KS.alert }]}>›</Text>
            </View>
          </ChamferContainer>
        </Pressable>

        {/* ── Daily Missions ── */}
        <View style={{ marginTop: 20, gap: 8 }}>
          <View style={styles.sectionHeader}>
            <SectionLabel label="Daily Missions · 2/4" />
            <Text style={styles.resetTimer}>RESETS 14:22:01</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: PAD }}>
              {DAILY_MISSIONS.map((m) => (
                <MissionChip key={m.id} mission={m} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Leaderboard teaser ── */}
        <Pressable onPress={() => router.push('/sousfriends/leaderboard')} style={{ marginTop: 16, marginBottom: 100 }}>
          <GlassCard width={cardWidth} height={100} chamfer={10} variant="tr-bl">
            <View style={styles.leaderInner}>
              <View style={styles.leaderHeader}>
                <Text style={styles.leaderTitle}>WEEKLY LEADERBOARD</Text>
                <Text style={[styles.leaderView, { color: KS.primary }]}>VIEW ›</Text>
              </View>
              <View style={styles.leaderPodium}>
                {TOP3.map((entry) => (
                  <View key={entry.rank} style={styles.leaderEntry}>
                    <Text style={[styles.leaderRank, { color: entry.color }]}>#{entry.rank}</Text>
                    <Text style={styles.leaderName}>{entry.name}</Text>
                    <Text style={[styles.leaderScore, { color: KS.live }]}>{entry.score}</Text>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>
        </Pressable>
      </ScrollView>
    </View>
  );
};

// ── Sub-components ──

interface Mission {
  id: string;
  title: string;
  reward: string;
  progress: number;
  complete: boolean;
}

const DAILY_MISSIONS: Mission[] = [
  { id: '1', title: 'WIN 3 ROUNDS', reward: '+120 XP', progress: 0.66, complete: false },
  { id: '2', title: 'FIRE 20 SHOTS', reward: '+80 XP', progress: 1, complete: true },
  { id: '3', title: 'USE SHIELD 5×', reward: '+60 XP', progress: 0.2, complete: false },
  { id: '4', title: 'PLAY RANKED', reward: '+200 XP', progress: 0, complete: false },
];

const MissionChip: React.FC<{ mission: Mission }> = ({ mission }) => (
  <ChamferContainer
    width={158}
    height={92}
    chamfer={8}
    variant="tr-bl"
    fill={mission.complete ? 'rgba(57,255,20,0.08)' : KS.surface}
    stroke={mission.complete ? KS.live : KS.hairSoft}
  >
    <View style={missionStyles.inner}>
      <Text style={missionStyles.title}>{mission.title}</Text>
      <Text style={[missionStyles.reward, { color: mission.complete ? KS.live : KS.alert }]}>
        {mission.complete ? '✓ COMPLETE' : mission.reward}
      </Text>
      <View style={missionStyles.barOuter}>
        <View style={[missionStyles.barInner, { width: `${mission.progress * 100}%` as any, backgroundColor: mission.complete ? KS.live : KS.primary }]} />
      </View>
    </View>
  </ChamferContainer>
);

const missionStyles = StyleSheet.create({
  inner: { flex: 1, padding: 10, justifyContent: 'space-between' },
  title: { color: KS.ink, fontFamily: TYPO.uiBold, fontSize: SIZES.bodySm },
  reward: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.18 },
  barOuter: { height: 4, backgroundColor: KS.hairSoft, borderRadius: 2, overflow: 'hidden' },
  barInner: { height: 4, borderRadius: 2 },
});

const TOP3 = [
  { rank: 1, name: 'GHOST_X', score: '12,840', color: KS.tier.gold },
  { rank: 2, name: 'SHADOW_09', score: '11,220', color: KS.tier.silver },
  { rank: 3, name: 'VIPER_7', score: '10,984', color: KS.tier.bronze },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { paddingTop: 60 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agentName: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.04,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  quickPlayInner: { flex: 1, padding: 14, gap: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: KS.live,
    shadowColor: KS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  liveText: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  quickPlayTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.hero,
    letterSpacing: SIZES.hero * 0.04,
    lineHeight: SIZES.hero * 0.92,
  },
  quickPlaySub: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoMd,
    letterSpacing: SIZES.monoMd * 0.18,
  },
  rankedStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  rankedInner: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankedLeft: { flex: 1, gap: 3 },
  rankedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankedTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: SIZES.titleMd * 0.04,
  },
  rankedSeason: {
    color: KS.alert,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  rankedRp: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  chevron: {
    fontFamily: TYPO.display,
    fontSize: 28,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetTimer: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  leaderInner: { flex: 1, padding: 12, gap: 8 },
  leaderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaderTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.04,
  },
  leaderView: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm },
  leaderPodium: { flexDirection: 'row', justifyContent: 'space-around' },
  leaderEntry: { alignItems: 'center', gap: 2 },
  leaderRank: { fontFamily: TYPO.monoBold, fontSize: SIZES.monoMd },
  leaderName: { color: KS.ink, fontFamily: TYPO.display, fontSize: 12 },
  leaderScore: { fontFamily: TYPO.mono, fontSize: 11 },
});

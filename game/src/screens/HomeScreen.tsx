import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { MOTION } from '../theme/motion';
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
} from '../components/ks';
import { useAuthStore } from '../stores/authStore';
import { useBotStore } from '../stores/botStore';
import { BotDifficulty } from '../game/botAI';
import { useDailyMissions, useClaimMission } from '../hooks/useDailyMissions';
import { DailyMission } from '../api/missions';

const PAD = 16;

// ── Difficulty config ──────────────────────────────────────────────────────

type DifficultyMeta = {
  id: BotDifficulty;
  label: string;
  codename: string;
  desc: string;
  accent: string;
  stripeColors: [string, string];
};

const DIFFICULTIES: DifficultyMeta[] = [
  {
    id: 'easy',
    label: 'EASY',
    codename: 'FIELD AGENT',
    desc: 'REACTIVE · SLOW RESPONSE',
    accent: KS.live,
    stripeColors: ['#39ff14', '#1aaf00'],
  },
  {
    id: 'medium',
    label: 'MEDIUM',
    codename: 'VETERAN OPS',
    desc: 'ADAPTIVE · PATTERN READING',
    accent: KS.alert,
    stripeColors: [KS.alert, '#b38800'],
  },
  {
    id: 'hard',
    label: 'HARD',
    codename: 'PHANTOM UNIT',
    desc: 'PREDICTIVE · COUNTER-STRATEGY',
    accent: KS.danger,
    stripeColors: [KS.danger, '#aa1500'],
  },
];

// ── Main screen ────────────────────────────────────────────────────────────

export const HomeScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT_KILO');
  const { difficulty: savedDifficulty, setDifficulty } = useBotStore();
  const cardWidth = width - PAD * 2;

  const [showBotModal, setShowBotModal] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<BotDifficulty>(savedDifficulty);

  const { data: missions, isLoading: missionsLoading } = useDailyMissions();
  const { mutate: claimMission } = useClaimMission();

  const handleQuickPlay = () => router.push('/play/partieRapide');
  const handleRanked = () => router.push('/play/partieRapide');

  const handleBotConfirm = () => {
    setDifficulty(selectedDiff);
    setShowBotModal(false);
    router.push('/play/bot');
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
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE · 24,387 AGENTS DEPLOYED</Text>
            </View>
            <Text style={styles.quickPlayTitle}>QUICK PLAY</Text>
            <Text style={styles.quickPlaySub}>1V1 · CASUAL · 2–5 MIN</Text>
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
            <LinearGradient
              colors={[KS.alert, KS.tier.diamond]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.leftStripe}
            />
            <View style={styles.modeInner}>
              <View style={styles.modeLeft}>
                <View style={styles.modeTitleRow}>
                  <RankBadge tier={3} size={28} />
                  <Text style={styles.modeTitle}>RANKED OPS</Text>
                </View>
                <Text style={[styles.modeSub, { color: KS.alert }]}>SEASON 02 · ENDS IN 18D 04H</Text>
                <Text style={[styles.modeDetail, { color: KS.tier.diamond }]}>+28 RP TO NEXT TIER</Text>
              </View>
              <Text style={[styles.chevron, { color: KS.alert }]}>›</Text>
            </View>
          </ChamferContainer>
        </Pressable>

        {/* ── VS BOT card ── */}
        <Pressable onPress={() => setShowBotModal(true)} style={{ marginTop: 8 }}>
          <ChamferContainer
            width={cardWidth}
            height={92}
            chamfer={10}
            variant="tr-bl"
            fill={KS.surface}
            stroke={KS.hairSoft}
          >
            {/* Green left stripe for bot */}
            <LinearGradient
              colors={['#39ff14', '#00aa00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.leftStripe}
            />
            <View style={styles.modeInner}>
              <View style={styles.modeLeft}>
                <View style={styles.modeTitleRow}>
                  {/* Robot icon (SVG-free ASCII stand-in) */}
                  <View style={styles.botIconWrap}>
                    <Text style={styles.botIcon}>⬡</Text>
                  </View>
                  <Text style={styles.modeTitle}>VS BOT</Text>
                </View>
                <Text style={[styles.modeSub, { color: KS.live }]}>TRAINING · NO MMR IMPACT</Text>
                <View style={styles.diffPill}>
                  <Text style={styles.diffPillText}>
                    {savedDifficulty.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.chevron, { color: KS.live }]}>›</Text>
            </View>
          </ChamferContainer>
        </Pressable>

        {/* ── Daily Missions ── */}
        <MissionStrip missions={missions} loading={missionsLoading} onClaim={claimMission} />

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

      {/* ── Bot difficulty modal ── */}
      <BotDifficultyModal
        visible={showBotModal}
        selected={selectedDiff}
        onSelect={setSelectedDiff}
        onConfirm={handleBotConfirm}
        onClose={() => setShowBotModal(false)}
        cardWidth={cardWidth}
      />
    </View>
  );
};

// ── Bot difficulty modal ───────────────────────────────────────────────────

interface ModalProps {
  visible: boolean;
  selected: BotDifficulty;
  onSelect: (d: BotDifficulty) => void;
  onConfirm: () => void;
  onClose: () => void;
  cardWidth: number;
}

const BotDifficultyModal: React.FC<ModalProps> = ({
  visible,
  selected,
  onSelect,
  onConfirm,
  onClose,
  cardWidth,
}) => {
  const translateY = useSharedValue(400);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withTiming(400, { duration: MOTION.exit, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetEyebrow}>// SELECT PROTOCOL</Text>
            <Text style={styles.sheetTitle}>VS BOT</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.sheetSub}>TRAINING MODE · NO MMR IMPACT</Text>

        {/* Difficulty cards */}
        <View style={styles.diffRow}>
          {DIFFICULTIES.map((d) => (
            <DiffCard
              key={d.id}
              meta={d}
              selected={selected === d.id}
              onPress={() => onSelect(d.id)}
              width={(cardWidth - 16) / 3}
            />
          ))}
        </View>

        {/* Selected description */}
        <View style={styles.diffDesc}>
          {(() => {
            const meta = DIFFICULTIES.find((d) => d.id === selected)!;
            return (
              <>
                <Text style={[styles.diffDescTitle, { color: meta.accent }]}>
                  {meta.codename}
                </Text>
                <Text style={styles.diffDescText}>{meta.desc}</Text>
              </>
            );
          })()}
        </View>

        {/* CTA */}
        <PrimaryButton
          label="DEPLOY TRAINING"
          subLabel={`DIFFICULTY: ${selected.toUpperCase()}`}
          onPress={onConfirm}
          size="large"
          style={{ marginTop: 16 }}
        />
      </Animated.View>
    </Modal>
  );
};

// ── Difficulty card ────────────────────────────────────────────────────────

interface DiffCardProps {
  meta: DifficultyMeta;
  selected: boolean;
  onPress: () => void;
  width: number;
}

const DiffCard: React.FC<DiffCardProps> = ({ meta, selected, onPress, width }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withTiming(0.96, { duration: MOTION.tap }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: MOTION.tap }); }}
      >
        <ChamferContainer
          width={width}
          height={112}
          chamfer={8}
          variant="tr-bl"
          fill={selected ? `${meta.accent}18` : KS.surfaceHi}
          stroke={selected ? meta.accent : KS.hairSoft}
          strokeWidth={selected ? 1.5 : 1}
        >
          {/* Top gradient stripe */}
          <LinearGradient
            colors={meta.stripeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={diffCardStyles.topStripe}
          />
          <View style={diffCardStyles.inner}>
            {selected && (
              <View style={[diffCardStyles.selectedDot, { backgroundColor: meta.accent }]} />
            )}
            <Text style={[diffCardStyles.label, { color: selected ? meta.accent : KS.ink }]}>
              {meta.label}
            </Text>
            <Text style={diffCardStyles.codename}>{meta.codename}</Text>
          </View>
        </ChamferContainer>
      </Pressable>
    </Animated.View>
  );
};

// ── Mission strip ──────────────────────────────────────────────────────────

function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

interface MissionStripProps {
  missions?: DailyMission[];
  loading: boolean;
  onClaim: (id: number) => void;
}

const MissionStrip: React.FC<MissionStripProps> = ({ missions, loading, onClaim }) => {
  const [msLeft, setMsLeft] = React.useState(msUntilMidnightUTC);

  React.useEffect(() => {
    const id = setInterval(() => setMsLeft(msUntilMidnightUTC()), 1000);
    return () => clearInterval(id);
  }, []);

  const completed = missions?.filter((m) => m.completed).length ?? 0;
  const total = missions?.length ?? 4;

  return (
    <View style={{ marginTop: 20, gap: 8 }}>
      <View style={styles.sectionHeader}>
        <SectionLabel label={`Daily Missions · ${completed}/${total}`} />
        <Text style={styles.resetTimer}>RESETS {formatCountdown(msLeft)}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: PAD }}>
          {loading || !missions
            ? Array.from({ length: 4 }).map((_, i) => (
                <MissionChip key={i} mission={null} onClaim={onClaim} />
              ))
            : missions.map((m) => (
                <MissionChip key={m.id} mission={m} onClaim={onClaim} />
              ))}
        </View>
      </ScrollView>
    </View>
  );
};

const MissionChip: React.FC<{ mission: DailyMission | null; onClaim: (id: number) => void }> = ({
  mission,
  onClaim,
}) => {
  if (!mission) {
    return (
      <ChamferContainer width={158} height={92} chamfer={8} variant="tr-bl" fill={KS.surface} stroke={KS.hairSoft}>
        <View style={missionStyles.inner}>
          <View style={[missionStyles.skeleton, { width: 100, height: 10 }]} />
          <View style={[missionStyles.skeleton, { width: 60, height: 9, marginTop: 4 }]} />
          <View style={missionStyles.barOuter}>
            <View style={[missionStyles.barInner, { width: '0%', backgroundColor: KS.surfaceHi }]} />
          </View>
        </View>
      </ChamferContainer>
    );
  }

  const progress = mission.target > 0 ? mission.current / mission.target : 0;
  const canClaim = mission.completed && !mission.rewarded;

  return (
    <Pressable onPress={canClaim ? () => onClaim(mission.id) : undefined}>
      <ChamferContainer
        width={158}
        height={92}
        chamfer={8}
        variant="tr-bl"
        fill={mission.rewarded ? 'rgba(57,255,20,0.04)' : mission.completed ? 'rgba(57,255,20,0.08)' : KS.surface}
        stroke={mission.rewarded ? KS.hairSoft : mission.completed ? KS.live : KS.hairSoft}
      >
        <View style={missionStyles.inner}>
          <Text style={missionStyles.title}>{mission.title}</Text>
          <Text style={[missionStyles.reward, { color: mission.rewarded ? KS.inkDim : mission.completed ? KS.live : KS.alert }]}>
            {mission.rewarded ? '✓ CLAIMED' : mission.completed ? `TAP · +${mission.xpReward} XP` : `+${mission.xpReward} XP`}
          </Text>
          <View style={missionStyles.barOuter}>
            <View style={[missionStyles.barInner, {
              width: `${Math.min(progress * 100, 100)}%` as any,
              backgroundColor: mission.rewarded ? KS.inkFaint : mission.completed ? KS.live : KS.primary,
            }]} />
          </View>
          <Text style={missionStyles.progressLabel}>
            {mission.current}/{mission.target}
          </Text>
        </View>
      </ChamferContainer>
    </Pressable>
  );
};

const TOP3 = [
  { rank: 1, name: 'GHOST_X',   score: '12,840', color: KS.tier.gold   },
  { rank: 2, name: 'SHADOW_09', score: '11,220', color: KS.tier.silver },
  { rank: 3, name: 'VIPER_7',   score: '10,984', color: KS.tier.bronze },
];

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { paddingTop: 60 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: KS.live,
    shadowColor: KS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 3, elevation: 2,
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

  leftStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  modeInner: {
    flex: 1,
    paddingLeft: 16, paddingRight: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  modeLeft: { flex: 1, gap: 3 },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: SIZES.titleMd * 0.04,
  },
  modeSub: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  modeDetail: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  chevron: { fontFamily: TYPO.display, fontSize: 28, paddingHorizontal: 8 },

  botIconWrap: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(57,255,20,0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.3)',
  },
  botIcon: { color: KS.live, fontSize: 16 },
  diffPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(57,255,20,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 1,
  },
  diffPillText: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: KS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: KS.hair,
    padding: PAD,
    paddingBottom: 40,
    gap: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  sheetEyebrow: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  sheetTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.04,
  },
  sheetSub: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
    marginBottom: 14,
  },
  closeBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: KS.surfaceHi,
    borderRadius: 16,
  },
  closeBtnText: { color: KS.inkMute, fontSize: 14 },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffDesc: {
    marginTop: 12,
    padding: 10,
    backgroundColor: KS.surfaceHi,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    gap: 2,
  },
  diffDescTitle: {
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.04,
  },
  diffDescText: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
});

const diffCardStyles = StyleSheet.create({
  topStripe: { height: 3 },
  inner: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selectedDot: {
    width: 6, height: 6, borderRadius: 3,
    marginBottom: 2,
  },
  label: {
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.04,
    textAlign: 'center',
  },
  codename: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
    textAlign: 'center',
  },
});

const missionStyles = StyleSheet.create({
  inner: { flex: 1, padding: 10, justifyContent: 'space-between' },
  title: { color: KS.ink, fontFamily: TYPO.uiBold, fontSize: SIZES.bodySm },
  reward: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.18 },
  barOuter: { height: 4, backgroundColor: KS.hairSoft, borderRadius: 2, overflow: 'hidden' },
  barInner: { height: 4, borderRadius: 2 },
  progressLabel: {
    color: KS.inkFaint,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
    marginTop: 2,
  },
  skeleton: { backgroundColor: KS.surfaceHi, borderRadius: 3 },
});

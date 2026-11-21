import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import {
  TopoBg,
  GlassCard,
  ChamferContainer,
  HexAvatar,
  RankBadge,
  SectionLabel,
} from '../components/ks';
import { useAuthStore } from '../stores/authStore';
import { useMyStats } from '../hooks/useGames';
import { useInventory } from '../hooks/useInventory';
import { OwnedCosmetic } from '../api/inventory';
import { GameHistoryItem } from '../api/games';
import { MatchHistory } from '../components/ks/MatchHistory';
import { ProgressBar } from '../components/ks/ProgressBar';
import { mmrToRank } from '../game/ranking';
import { levelFromXp, levelProgress } from '../game/progression';
import { rankTierIndex, rankTierName } from '../game/rankDisplay';

const PAD = 16;

// ── Rarity colour map (shared with ShopScreen) ─────────────────────────────
const RARITY_COLOR: Record<string, string> = {
  common:    KS.rarity.common,
  uncommon:  '#7be0ff',
  rare:      KS.rarity.rare,
  epic:      KS.rarity.epic,
  legendary: KS.rarity.legendary,
  mythic:    '#ff3b30',
  secret:    '#ffffff',
};

// ── Corner ticks (HUD chrome for avatar card) ──────────────────────────────
const CornerTick: React.FC<{
  top?: number; bottom?: number; left?: number; right?: number;
  borderTop?: string; borderBottom?: string; borderLeft?: string; borderRight?: string;
}> = (props) => (
  <View style={{
    position: 'absolute',
    width: 14, height: 14,
    top: props.top, bottom: props.bottom,
    left: props.left, right: props.right,
    borderTopWidth:    props.borderTop    ? 1.5 : 0,
    borderBottomWidth: props.borderBottom ? 1.5 : 0,
    borderLeftWidth:   props.borderLeft   ? 1.5 : 0,
    borderRightWidth:  props.borderRight  ? 1.5 : 0,
    borderColor: KS.hair,
  }} />
);

const CornerTicks: React.FC = () => (
  <>
    <CornerTick top={8}  left={8}  borderTop="1" borderLeft="1" />
    <CornerTick top={8}  right={8} borderTop="1" borderRight="1" />
    <CornerTick bottom={8} left={8}  borderBottom="1" borderLeft="1" />
    <CornerTick bottom={8} right={8} borderBottom="1" borderRight="1" />
  </>
);

// ── Stat pod ───────────────────────────────────────────────────────────────
const StatPod: React.FC<{ label: string; value: string; accent: string; width: number }> = ({
  label, value, accent, width,
}) => (
  <ChamferContainer
    width={width}
    height={64}
    chamfer={6}
    variant="tr-bl"
    fill="rgba(0,0,0,0.4)"
    stroke={accent}
    strokeWidth={0}
  >
    {/* Top accent stripe */}
    <View style={[statStyles.topStripe, { backgroundColor: accent }]} />
    <View style={statStyles.inner}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  </ChamferContainer>
);

const statStyles = StyleSheet.create({
  topStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 2 },
  label: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.22,
  },
  value: {
    color: KS.ink,
    fontFamily: TYPO.mono,
    fontSize: SIZES.titleMd,
    lineHeight: SIZES.titleMd * 1.1,
  },
});

// ── Rank sparkline ─────────────────────────────────────────────────────────
/** Rating over the recent games. With fewer than two points it is a flat line. */
const Sparkline: React.FC<{ width: number; values: number[] }> = ({ width, values }) => {
  const points = values.length >= 2 ? values : [0, 0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * 200;
    const y = 32 - ((v - min) / span) * 28;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = `M${coords.join(' L')}`;
  const rising = points[points.length - 1] >= points[0];
  const color = rising ? KS.live : KS.danger;
  return (
    <Svg width={width} height={36} viewBox="0 0 200 36" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={rising ? "spark-up" : "spark-down"} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.4" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`${line} L200 36 L0 36 Z`} fill={`url(#${rising ? "spark-up" : "spark-down"})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
};

// ── Skin card ──────────────────────────────────────────────────────────────
const SkinCard: React.FC<{ skin: OwnedCosmetic; width: number }> = ({ skin, width }) => {
  const c = RARITY_COLOR[skin.rarity] ?? KS.inkMute;
  const borderColor = skin.equipped ? KS.live : c;

  return (
    <ChamferContainer
      width={width}
      height={96}
      chamfer={6}
      variant="tr-bl"
      fill="rgba(0,0,0,0.4)"
      stroke={borderColor}
    >
      {/* Hex avatar placeholder (no real image yet) */}
      <View style={skinStyles.avatarWrap}>
        <HexAvatar
          size={38}
          tier={skin.rarity === 'legendary' ? 'gold' : skin.rarity === 'epic' ? 'diamond' : 'silver'}
          initials={skin.name.slice(0, 2)}
        />
      </View>

      {/* Name + rarity */}
      <View style={skinStyles.bottom}>
        <Text style={skinStyles.name} numberOfLines={1}>{skin.name.toUpperCase()}</Text>
        <Text style={[skinStyles.rarity, { color: c }]}>{skin.rarity.toUpperCase()}</Text>
      </View>

      {/* EQ badge */}
      {skin.equipped && (
        <View style={skinStyles.eqBadge}>
          <Text style={skinStyles.eqText}>EQ</Text>
        </View>
      )}
    </ChamferContainer>
  );
};

const skinStyles = StyleSheet.create({
  avatarWrap: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 1,
  },
  name: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: 10,
    letterSpacing: 10 * 0.16,
  },
  rarity: {
    fontFamily: TYPO.mono,
    fontSize: 8,
    letterSpacing: 8 * 0.18,
  },
  eqBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: KS.live,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  eqText: {
    color: '#000',
    fontFamily: TYPO.monoBold,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 8 * 0.14,
  },
});

// ── Main screen ────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT');
  const mmr = useAuthStore((s) => s.user?.mmr ?? 0);
  const xp = useAuthStore((s) => s.user?.xp ?? 0);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const { data: statsData } = useMyStats();
  const { data: inventoryData } = useInventory();

  const cardWidth = width - PAD * 2;
  const podWidth = (cardWidth - 18) / 4; // 3 gaps of 6px

  // ── Derived stats ──
  const allWins = (statsData?.stats.quick.wins ?? 0) + (statsData?.stats.ranked.wins ?? 0);
  const allTotal = (statsData?.stats.quick.total ?? 0) + (statsData?.stats.ranked.total ?? 0);
  const allLosses = allTotal - allWins;
  const winPct = allTotal > 0 ? Math.round((allWins / allTotal) * 100) : 0;
  const wlRatio = allLosses > 0 ? (allWins / allLosses).toFixed(1) : allWins > 0 ? '∞' : '—';
  const rankTier = rankTierIndex(mmr);

  // Current win streak: recentGames is newest first, so count wins from the start.
  const recentGames: GameHistoryItem[] = statsData?.recentGames ?? [];
  const firstNonWin = recentGames.findIndex((g) => !g.won);
  const streak = firstNonWin === -1 ? recentGames.length : firstNonWin;

  // RP gained over recent games
  const rpDelta = recentGames.reduce((sum: number, g: GameHistoryItem) => sum + g.mmrDelta, 0);
  const rpDeltaStr = rpDelta >= 0 ? `+${rpDelta}` : `${rpDelta}`;

  const level = levelFromXp(xp);

  // RP curve over the recent games, oldest → newest, ending at the current rating.
  const rpCurve = (() => {
    const deltas = [...recentGames].reverse().map((g) => g.mmrDelta);
    const total = deltas.reduce((a, b) => a + b, 0);
    let value = mmr - total;
    return [value, ...deltas.map((d) => (value += d))];
  })();

  // Skins: show card_skin items from inventory, fallback to all owned
  const skins = (inventoryData?.owned ?? [] as OwnedCosmetic[]).filter((i: OwnedCosmetic) => i.type === 'card_skin');
  const ownedCount = skins.length;

  // Sparkline panel width
  const sparkWidth = cardWidth - 120; // leave room for the left label block

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TopoBg />

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD, paddingTop: insets.top + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Eyebrow ── */}
          <View style={styles.eyebrow}>
            <View>
              <Text style={styles.eyebrowMono}>// AGENT FILE</Text>
              <Text style={styles.eyebrowTitle}>DOSSIER</Text>
            </View>
            <View style={styles.iconBtns}>
              {/* Settings */}
              <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8}>
                <ChamferContainer
                  width={36}
                  height={36}
                  chamfer={6}
                  variant="tr-bl"
                  fill="rgba(0,0,0,0.4)"
                  stroke={KS.hairSoft}
                >
                  <View style={styles.iconBtnInner}>
                    <Text style={styles.iconBtnGlyph}>⚙</Text>
                  </View>
                </ChamferContainer>
              </Pressable>
              {/* Inventory */}
              <Pressable onPress={() => router.push('/(tabs)/inventory')} accessibilityRole="button" accessibilityLabel="Inventory" hitSlop={8}>
                <ChamferContainer
                  width={36}
                  height={36}
                  chamfer={6}
                  variant="tr-bl"
                  fill="rgba(0,0,0,0.4)"
                  stroke={KS.hairSoft}
                >
                  <View style={styles.iconBtnInner}>
                    <Text style={styles.iconBtnGlyph}>▦</Text>
                  </View>
                </ChamferContainer>
              </Pressable>
            </View>
          </View>

          {/* ── Avatar showcase card ── */}
          <GlassCard
            width={cardWidth}
            height={188}
            chamfer={14}
            variant="tr-bl"
            style={{ marginTop: 12 }}
          >
            {/* Radial spotlight */}
            <View style={styles.spotlight} pointerEvents="none" />

            {/* Large hex avatar */}
            <View style={styles.avatarCenter}>
              <HexAvatar size={108} tier={rankTierName(mmr)} initials={username.slice(0, 2).toUpperCase()} live />
            </View>

            {/* Bottom row: name + rank · level */}
            <View style={styles.showcaseBottom}>
              <View>
                <Text style={styles.showcaseName}>{username.toUpperCase()}</Text>
                <View style={styles.rankRow}>
                  <RankBadge tier={rankTier} size={16} />
                  <Text style={[styles.rankLabel, { color: KS.tier.gold }]}>
                    {mmrToRank(mmr).label.toUpperCase()} · {mmr.toLocaleString()} RP
                  </Text>
                </View>
              </View>
              <View style={styles.levelBlock}>
                <Text style={styles.levelLabel}>LVL {level}</Text>
                <ProgressBar value={levelProgress(xp)} segments={10} color={KS.primary} height={4} />
                <Text style={styles.xpLabel}>{xp.toLocaleString()} XP</Text>
              </View>
            </View>

            <CornerTicks />
          </GlassCard>

          {/* ── Stats strip ── */}
          <View style={styles.statsRow}>
            <StatPod label="W/L"    value={`${wlRatio}`}   accent={KS.primary}       width={podWidth} />
            <StatPod label="WIN %"  value={`${winPct}`}    accent={KS.live}          width={podWidth} />
            <StatPod label="MATCH"  value={`${allTotal}`}  accent={KS.alert}         width={podWidth} />
            <StatPod label="STREAK" value={`${streak}`}    accent={KS.tier.diamond}  width={podWidth} />
          </View>

          {/* ── Rank sparkline ── */}
          <GlassCard
            width={cardWidth}
            height={64}
            chamfer={10}
            variant="tr-bl"
            style={{ marginTop: 6 }}
          >
            <View style={styles.sparkInner}>
              <View style={styles.sparkLeft}>
                <Text style={styles.sparkDays}>LAST {recentGames.length} GAMES</Text>
                <View style={styles.sparkDelta}>
                  <Text style={styles.sparkValue}>{rpDeltaStr}</Text>
                  <Text style={styles.sparkRp}>RP {rpDelta >= 0 ? '↑' : '↓'}</Text>
                </View>
              </View>
              <Sparkline width={sparkWidth} values={rpCurve} />
            </View>
          </GlassCard>

          {/* ── Skins grid ── */}
          <View style={{ marginTop: 16 }}>
            <SectionLabel
              label={`Loadout · Skins · ${ownedCount}/12`}
              color={KS.alert}
            />
            {skins.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No skins yet — visit the shop to gear up.
                </Text>
              </View>
            ) : (
              <View style={styles.skinsGrid}>
                {skins.map((skin: OwnedCosmetic) => {
                  const skinWidth = (cardWidth - 16) / 3;
                  return (
                    <SkinCard key={skin.userCosmeticId} skin={skin} width={skinWidth} />
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Match history ── */}
          {!isGuest && <MatchHistory />}
          <View style={{ height: 108 }} />
        </ScrollView>
      </View>
    </>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: {},

  eyebrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrowMono: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.32,
  },
  eyebrowTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: SIZES.titleMd * 0.1,
    marginTop: 2,
  },
  iconBtns: { flexDirection: 'row', gap: 6 },
  iconBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtnGlyph: { color: KS.inkMute, fontSize: 16 },

  // Avatar showcase
  spotlight: {
    position: 'absolute',
    top: 0,
    left: '25%' as any,
    right: '25%' as any,
    height: '100%' as any,
    backgroundColor: 'transparent',
    shadowColor: KS.primaryGlow,
    shadowOffset: { width: 0, height: 60 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  avatarCenter: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  showcaseBottom: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  showcaseName: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: SIZES.titleMd * 0.06,
    lineHeight: SIZES.titleMd,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  rankLabel: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  levelBlock: { alignItems: 'flex-end', gap: 3, width: 84 },
  xpLabel: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  levelLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.2,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },

  // Sparkline
  sparkInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
  },
  sparkLeft: { width: 80, gap: 2 },
  sparkDays: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.22,
  },
  sparkDelta: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  sparkValue: {
    color: KS.ink,
    fontFamily: TYPO.mono,
    fontSize: 18,
  },
  sparkRp: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },

  // Skins
  skinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  emptyState: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.14,
    textAlign: 'center',
  },
});

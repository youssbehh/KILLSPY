import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { TopoBg } from '../components/ks/TopoBg';
import { HexAvatar } from '../components/ks/HexAvatar';
import { RankBadge } from '../components/ks/RankBadge';
import { ChamferContainer } from '../components/ks/ChamferContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLeaderboardPages, useMyLeaderboardPosition } from '../hooks/useLeaderboard';
import { useAuthStore } from '../stores/authStore';
import { LeaderboardEntry } from '../api/leaderboard';
import { rankTierIndex } from '../game/rankDisplay';
import { useRankLabel } from '../game/displayNames';
import { useLocalT } from '../i18n/local';

const STRINGS = {
  fr: {
    back: 'Retour',
    eyebrow: '‹ RETOUR · // RENSEIGNEMENT · CLASSEMENT MONDIAL',
    title: 'CLASSEMENT',
    unavailable: 'RENSEIGNEMENTS INDISPONIBLES',
    tapRetry: 'TOUCHER POUR RÉESSAYER',
    empty: 'AUCUN AGENT CLASSÉ',
    emptyHint: 'JOUE EN CLASSÉ POUR PRENDRE LA PREMIÈRE PLACE',
    loadMoreA11y: 'Charger plus',
    loadMore: 'CHARGER PLUS',
    yourPosition: '// TA POSITION',
    tier0: 'RECRUE',
    tier1: 'OPÉRATEUR',
    tier2: 'AGENT',
    tier3: 'SPÉCIALISTE',
    tier4: 'FANTÔME',
  },
  en: {
    back: 'Back',
    eyebrow: '‹ BACK · // INTEL · GLOBAL LADDER',
    title: 'LEADERBOARD',
    unavailable: 'INTEL UNAVAILABLE',
    tapRetry: 'TAP TO RETRY',
    empty: 'NO RANKED AGENT YET',
    emptyHint: 'PLAY RANKED TO CLAIM THE TOP SPOT',
    loadMoreA11y: 'Load more',
    loadMore: 'LOAD MORE',
    yourPosition: '// YOUR POSITION',
    tier0: 'RECRUIT',
    tier1: 'OPERATIVE',
    tier2: 'AGENT',
    tier3: 'SPECIALIST',
    tier4: 'PHANTOM',
  },
} as const;

const TIER_TITLES = ['tier0', 'tier1', 'tier2', 'tier3', 'tier4'] as const;

const toRow = (e: LeaderboardEntry) => ({
  rank: e.position,
  name: e.username.toUpperCase(),
  tier: rankTierIndex(e.mmr),
  score: e.mmr.toLocaleString('en-US'),
  delta: 0,
});


const PAD = 16;

export const LeaderboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useLocalT(STRINGS);
  const rankName = useRankLabel();
  const me = useAuthStore((s) => s.user);
  const { entries, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useLeaderboardPages();
  const { data: myPosition } = useMyLeaderboardPosition();
  const podium = entries.slice(0, 3).map((e) => ({ ...toRow(e), rp: rankName(e.rank.id) }));
  const rest = entries.slice(3).map(toRow);
  const myRow = myPosition ? toRow(myPosition as LeaderboardEntry) : null;

  return (
    <View style={styles.container}>
      <TopoBg />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('back')} hitSlop={12}>
          <Text style={styles.eyebrow}>{t('eyebrow')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <ActivityIndicator color={KS.primary} style={{ marginTop: 60 }} />}

        {isError && (
          <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.stateBox}>
            <Text style={[styles.stateText, { color: KS.danger }]}>{t('unavailable')}</Text>
            <Text style={styles.stateHint}>{t('tapRetry')}</Text>
          </Pressable>
        )}

        {!isLoading && !isError && entries.length === 0 && (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{t('empty')}</Text>
            <Text style={styles.stateHint}>{t('emptyHint')}</Text>
          </View>
        )}

        {/* Podium */}
        {podium.length > 0 && (
          <View style={styles.podium}>
            {podium[1] && <PodiumColumn entry={podium[1]} width={(width - PAD * 2) * 0.3} pedHeight={0.78} />}
            <PodiumColumn entry={podium[0]} width={(width - PAD * 2) * 0.36} pedHeight={1} isFirst />
            {podium[2] && <PodiumColumn entry={podium[2]} width={(width - PAD * 2) * 0.3} pedHeight={0.64} />}
          </View>
        )}

        {/* List */}
        <View style={styles.list}>
          {rest.map((entry) => (
            <LeaderRow key={entry.rank} entry={entry} self={entry.rank === myRow?.rank} />
          ))}
        </View>

        {hasNextPage && (
          <Pressable
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            accessibilityRole="button"
            accessibilityLabel={t('loadMoreA11y')}
            style={styles.more}
          >
            {isFetchingNextPage ? <ActivityIndicator color={KS.primary} /> : <Text style={styles.moreText}>{t('loadMore')}</Text>}
          </Pressable>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pinned own rank */}
      {myRow && !me?.guest && (
        <View style={[styles.ownRank, { left: PAD, right: PAD, bottom: insets.bottom + 12 }]}>
          <Text style={styles.ownEyebrow}>
            {t('yourPosition')}
          </Text>
          <LeaderRow entry={myRow} self />
        </View>
      )}
    </View>
  );
};

// ── Sub-components ──

interface PodiumEntry {
  rank: number;
  name: string;
  score: string;
  tier: 0 | 1 | 2 | 3 | 4;
  rp: string;
}

const PodiumColumn: React.FC<{
  entry: PodiumEntry;
  width: number;
  pedHeight: number;
  isFirst?: boolean;
}> = ({ entry, width, pedHeight, isFirst }) => {
  const tierColor = KS.tier[['bronze','silver','gold','diamond','phantom'][entry.tier] as keyof typeof KS.tier];
  const avatarSize = isFirst ? 56 : 44;
  const pedBase = 100;

  return (
    <View style={[podiumStyles.col, { width }]}>
      {isFirst && (
        <Text style={[podiumStyles.crown, { color: KS.alert }]}>👑</Text>
      )}
      <HexAvatar size={avatarSize} tier={['bronze','silver','gold','diamond','phantom'][entry.tier] as any} initials={entry.name.slice(0,2)} />
      <Text style={podiumStyles.name}>{entry.name}</Text>
      <Text style={[podiumStyles.score, { color: tierColor }]}>{entry.score}</Text>
      {/* Pedestal */}
      <ChamferContainer
        width={width - 4}
        height={pedBase * pedHeight}
        chamfer={6}
        variant="all"
        fill={KS.surface}
        stroke={tierColor}
        strokeWidth={1}
      >
        <View style={podiumStyles.pedInner}>
          <Text style={[podiumStyles.pedRank, { color: tierColor }]}>
            #{entry.rank}
          </Text>
        </View>
      </ChamferContainer>
    </View>
  );
};

interface ListEntry {
  rank: number;
  name: string;
  tier: 0 | 1 | 2 | 3 | 4;
  score: string;
  delta: number;
}

const LeaderRow: React.FC<{ entry: ListEntry; self: boolean }> = ({ entry, self }) => {
  const t = useLocalT(STRINGS);
  const tierName = ['bronze','silver','gold','diamond','phantom'][entry.tier] as keyof typeof KS.tier;
  const deltaColor = entry.delta > 0 ? KS.live : entry.delta < 0 ? KS.danger : KS.inkDim;
  const deltaStr = entry.delta > 0 ? `+${entry.delta}` : entry.delta < 0 ? `${entry.delta}` : '—';

  return (
    <View style={[rowStyles.row, self && { backgroundColor: 'rgba(0,123,255,0.08)', borderColor: KS.primary }]}>
      <Text style={[rowStyles.rank, { color: KS.inkDim }]}>
        {entry.rank > 0 ? `#${entry.rank}` : '—'}
      </Text>
      <HexAvatar size={28} tier={tierName} initials={entry.name.slice(0,2)} />
      <View style={rowStyles.nameCol}>
        <Text style={rowStyles.name}>{entry.name}</Text>
        <Text style={rowStyles.rankName}>
          {t(TIER_TITLES[entry.tier])}
        </Text>
      </View>
      <Text style={rowStyles.score}>{entry.score}</Text>
      <Text style={[rowStyles.delta, { color: deltaColor }]}>{deltaStr}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: KS.hair, borderRadius: 4, marginTop: 8 },
  moreText: { color: KS.primary, fontFamily: TYPO.display, fontSize: SIZES.labelLg },
  stateBox: { alignItems: 'center', paddingVertical: 60, gap: 6 },
  stateText: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleSm },
  stateHint: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  container: { flex: 1, backgroundColor: KS.bg },
  header: { paddingHorizontal: PAD, gap: 4 },
  eyebrow: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.04,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: KS.hairSoft,
  },
  tabActive: {
    backgroundColor: KS.primary,
    borderColor: KS.primary,
  },
  tabText: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
  },
  tabTextActive: { color: KS.onPrimary },
  scroll: { paddingTop: 8 },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
    height: 200,
    marginBottom: 16,
  },
  list: { gap: 4 },
  ownRank: {
    position: 'absolute',
    bottom: 80,
    backgroundColor: KS.bg,
    borderWidth: 1,
    borderColor: KS.primary,
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  ownEyebrow: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
  },
});

const podiumStyles = StyleSheet.create({
  col: { alignItems: 'center', gap: 4 },
  crown: { fontSize: 20 },
  name: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: 12,
    textAlign: 'center',
  },
  score: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, textAlign: 'center' },
  pedInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pedRank: { fontFamily: TYPO.monoBold, fontSize: 22 },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rank: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, width: 30 },
  nameCol: { flex: 1, gap: 1 },
  name: { color: KS.ink, fontFamily: TYPO.display, fontSize: 13 },
  rankName: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXxs },
  score: { color: KS.ink, fontFamily: TYPO.mono, fontSize: 13 },
  delta: { fontFamily: TYPO.monoBold, fontSize: SIZES.monoSm, width: 28, textAlign: 'right' },
});

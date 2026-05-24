import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { TopoBg } from '../components/ks/TopoBg';
import { HexAvatar } from '../components/ks/HexAvatar';
import { RankBadge } from '../components/ks/RankBadge';
import { ChamferContainer } from '../components/ks/ChamferContainer';
import { SectionLabel } from '../components/ks/SectionLabel';

const PODIUM = [
  { rank: 1, name: 'GHOST_X',    score: '12,840', tier: 4 as const, rp: '+142' },
  { rank: 2, name: 'SHADOW_09',  score: '11,220', tier: 3 as const, rp: '+98'  },
  { rank: 3, name: 'VIPER_7',    score: '10,984', tier: 2 as const, rp: '+67'  },
];

const LIST_ENTRIES = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 4,
  name: `AGENT_${(100 + i).toString(36).toUpperCase()}`,
  tier: Math.max(0, 2 - Math.floor(i / 7)) as 0 | 1 | 2,
  score: (10000 - i * 380).toLocaleString('en-US'),
  delta: i % 3 === 0 ? +12 : i % 5 === 0 ? -3 : 0,
}));

const MY_RANK = { rank: 47, name: 'AGENT_KILO', tier: 2 as const, score: '7,340', delta: +5 };

const PAD = 16;

export const LeaderboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <TopoBg />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 60 }]}>
        <Text style={styles.eyebrow}>// INTEL · WEEK 12</Text>
        <Text style={styles.title}>LEADERBOARD</Text>
      </View>

      {/* Tab strip */}
      <View style={styles.tabs}>
        {['GLOBAL','FRIENDS','REGIONAL'].map((t, i) => (
          <Pressable key={t}>
            <View style={[styles.tab, i === 0 && styles.tabActive]}>
              <Text style={[styles.tabText, i === 0 && styles.tabTextActive]}>
                {t}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Podium */}
        <View style={styles.podium}>
          {/* 2nd */}
          <PodiumColumn entry={PODIUM[1]} width={(width - PAD * 2) * 0.3} pedHeight={0.78} />
          {/* 1st (center, wider) */}
          <PodiumColumn entry={PODIUM[0]} width={(width - PAD * 2) * 0.36} pedHeight={1} isFirst />
          {/* 3rd */}
          <PodiumColumn entry={PODIUM[2]} width={(width - PAD * 2) * 0.3} pedHeight={0.64} />
        </View>

        {/* List */}
        <View style={styles.list}>
          {LIST_ENTRIES.map((entry) => (
            <LeaderRow key={entry.rank} entry={entry} self={false} />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pinned own rank */}
      <View style={[styles.ownRank, { left: PAD, right: PAD }]}>
        <Text style={styles.ownEyebrow}>// YOUR POSITION</Text>
        <LeaderRow entry={MY_RANK} self />
      </View>
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
  const tierName = ['bronze','silver','gold','diamond','phantom'][entry.tier] as keyof typeof KS.tier;
  const deltaColor = entry.delta > 0 ? KS.live : entry.delta < 0 ? KS.danger : KS.inkDim;
  const deltaStr = entry.delta > 0 ? `+${entry.delta}` : entry.delta < 0 ? `${entry.delta}` : '—';

  return (
    <View style={[rowStyles.row, self && { backgroundColor: 'rgba(0,123,255,0.08)', borderColor: KS.primary }]}>
      <Text style={[rowStyles.rank, { color: KS.inkDim }]}>
        #{entry.rank}
      </Text>
      <HexAvatar size={28} tier={tierName} initials={entry.name.slice(0,2)} />
      <View style={rowStyles.nameCol}>
        <Text style={rowStyles.name}>{entry.name}</Text>
        <Text style={rowStyles.rankName}>
          {['RECRUIT','OPERATIVE','AGENT','SPECIALIST','PHANTOM'][entry.tier]}
        </Text>
      </View>
      <Text style={rowStyles.score}>{entry.score}</Text>
      <Text style={[rowStyles.delta, { color: deltaColor }]}>{deltaStr}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
  tabTextActive: { color: KS.ink },
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

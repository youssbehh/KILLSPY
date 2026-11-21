import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '../../theme/colors';
import { TYPO, SIZES, ls } from '../../theme/typography';
import { HexAvatar } from '../../components/ks/HexAvatar';
import { RankBadge } from '../../components/ks/RankBadge';
import { ProgressBar } from '../../components/ks/ProgressBar';
import { usePublicProfile } from '../../hooks/useFriends';
import { extractApiError } from '../../api/client';
import type { PublicProfile } from '../../api/friends';
import { levelProgress } from '../../game/progression';
import { rankTierIndex, rankTierName } from '../../game/rankDisplay';
import { FriendsT, useFriendsT } from './strings';
import { PlayerActions } from './PlayerActions';
import { ActionButton, PAD, PlayerRef, StateBox } from './ui';

interface Props {
  player: PlayerRef;
  onClose: () => void;
  onMessage: (player: PlayerRef) => void;
  onUnfriended: (player: PlayerRef) => void;
}

const ProfileDetails: React.FC<{ profile: PublicProfile; t: FriendsT }> = ({ profile, t }) => {
  const tierColor = KS.tier[rankTierName(profile.mmr)];
  const stats: { label: string; value: string }[] = [
    { label: t('wins'), value: String(profile.stats.wins) },
    { label: t('losses'), value: String(profile.stats.losses) },
    { label: t('games'), value: String(profile.stats.total) },
    { label: t('winRate'), value: `${Math.round(profile.stats.winRate * 100)}%` },
  ];

  return (
    <View style={styles.details}>
      <View style={styles.rankRow}>
        <RankBadge tier={rankTierIndex(profile.mmr)} size={32} />
        <Text style={[styles.rankName, { color: tierColor }]}>{t(`rank_${profile.rank.id}`).toUpperCase()}</Text>
        <Text style={styles.mono}>{t('mmr', { mmr: profile.mmr })}</Text>
      </View>

      <ProgressBar
        value={levelProgress(profile.xp)}
        label={t('level', { level: profile.level })}
        sublabel={`${profile.xp} XP`}
        color={KS.primary}
      />

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.mono}>
        {t('guild')} ·{' '}
        {profile.guild
          ? `[${profile.guild.tag}] ${profile.guild.name} · ${t(`role_${profile.guild.role}`)}`
          : t('noGuild')}
      </Text>
      <Text style={styles.mono}>{t('since', { date: new Date(profile.since).toLocaleDateString() })}</Text>
    </View>
  );
};

/** Bottom sheet: public profile of a player + remove / block / report actions. */
export const PlayerSheet: React.FC<Props> = ({ player, onClose, onMessage, onUnfriended }) => {
  const t = useFriendsT();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch } = usePublicProfile(player.id);
  const profile = data as PublicProfile | undefined;
  const name = profile?.username ?? player.username;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + PAD }]} accessibilityViewIsModal>
          <View style={styles.header}>
            <HexAvatar
              size={56}
              tier={rankTierName(profile?.mmr ?? 0)}
              initials={name}
              live={profile?.online === true}
            />
            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
                {name}
              </Text>
              {profile ? (
                <Text style={[styles.mono, { color: profile.online ? KS.live : KS.inkDim }]}>
                  {profile.online ? `● ${t('online')}` : `○ ${t('offline')}`} · {t(`relation_${profile.relation}`)}
                </Text>
              ) : null}
            </View>
            <ActionButton label="✕" accessibilityLabel={t('close')} tone="neutral" onPress={onClose} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <StateBox kind="loading" />
            ) : isError || !profile ? (
              <StateBox kind="error" hint={isError ? extractApiError(error).message : undefined} onRetry={() => refetch()} />
            ) : (
              <ProfileDetails profile={profile} t={t} />
            )}
            {isLoading ? null : (
              <PlayerActions
                player={{ id: player.id, username: name }}
                relation={profile?.relation ?? null}
                onMessage={onMessage}
                onUnfriended={onUnfriended}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: KS.glass },
  sheet: {
    maxHeight: '88%',
    backgroundColor: KS.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: KS.hair,
    paddingHorizontal: PAD,
    paddingTop: PAD,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerText: { flex: 1, gap: 2 },
  name: { fontFamily: TYPO.display, fontSize: SIZES.titleMd, color: KS.ink, letterSpacing: ls(SIZES.titleMd, 0.04) },
  mono: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, color: KS.inkDim },
  details: { gap: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankName: { flex: 1, fontFamily: TYPO.display, fontSize: SIZES.titleSm, letterSpacing: ls(SIZES.titleSm, 0.06) },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    backgroundColor: KS.surface,
  },
  statValue: { fontFamily: TYPO.display, fontSize: SIZES.titleSm, color: KS.ink },
  statLabel: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs, color: KS.inkDim, marginTop: 2 },
});

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { ChamferContainer, SectionLabel } from '../../components/ks';
import { GuildDTO } from '../../api/guilds';
import { extractApiError } from '../../api/client';
import { useJoinGuild } from '../../hooks/useGuilds';
import { HqT, useHqT } from './strings';
import {
  EmptyState, ErrorState, Feedback, FeedbackLine, KsButton, LoadingState, TagChip, styles as ui,
} from './ui';

export interface DirectoryList {
  guilds: GuildDTO[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
}

interface Props {
  list: DirectoryList;
  search: string;
  /** The search actually sent to the API (debounced). */
  activeSearch: string;
  onSearchChange: (value: string) => void;
  cardWidth: number;
}

const ROW_HEIGHT = 76;

const GuildRow: React.FC<{
  guild: GuildDTO; width: number; t: HqT; joining: boolean; disabled: boolean; onJoin: () => void;
}> = ({ guild, width, t, joining, disabled, onJoin }) => {
  const isFull = guild.memberCount >= guild.maxMembers;
  const status = isFull ? t('full') : guild.isOpen ? t('open') : t('inviteOnly');
  return (
    <ChamferContainer width={width} height={ROW_HEIGHT} chamfer={8} variant="tr-bl" fill={KS.surface} stroke={KS.hairSoft}>
      <View style={local.row}>
        <TagChip tag={guild.tag} />
        <View style={local.info}>
          <Text style={ui.rowName} numberOfLines={1}>{guild.name}</Text>
          <Text style={ui.rowMeta} numberOfLines={1}>
            {t('membersCount', { count: guild.memberCount, max: guild.maxMembers })} · {status}
          </Text>
        </View>
        {guild.isOpen && !isFull ? (
          <KsButton
            label={t('join')}
            a11yLabel={t('joinA11y', { guild: guild.name })}
            tone="live"
            busy={joining}
            disabled={disabled}
            onPress={onJoin}
          />
        ) : (
          <Text style={[local.locked, isFull && { color: KS.danger }]}>
            {isFull ? t('full') : t('inviteOnly')}
          </Text>
        )}
      </View>
    </ChamferContainer>
  );
};

/** Searchable, paginated list of guilds with a join button on the open ones. */
export const GuildDirectory: React.FC<Props> = ({ list, search, activeSearch, onSearchChange, cardWidth }) => {
  const t = useHqT();
  const join = useJoinGuild();
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleJoin = (guildId: number) => {
    setFeedback(null);
    setJoiningId(guildId);
    join.mutate(guildId, {
      onError: (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false }),
      onSettled: () => setJoiningId(null),
    });
  };

  const isEmpty = !list.isLoading && !list.isError && list.guilds.length === 0;

  return (
    <View style={local.section}>
      <SectionLabel label={t('directorySection', { count: list.guilds.length })} />
      <TextInput
        style={ui.input}
        placeholder={t('searchPlaceholder')}
        placeholderTextColor={KS.inkFaint}
        accessibilityLabel={t('searchA11y')}
        value={search}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        maxLength={24}
      />
      <FeedbackLine feedback={feedback} />

      {list.isLoading && <LoadingState />}
      {list.isError && list.guilds.length === 0 && (
        <ErrorState text={t('directoryError')} onRetry={() => list.refetch()} />
      )}
      {isEmpty && (
        <EmptyState
          text={activeSearch ? t('directoryEmptySearch', { search: activeSearch }) : t('directoryEmpty')}
        />
      )}

      {list.guilds.map((guild) => (
        <GuildRow
          key={guild.id}
          guild={guild}
          width={cardWidth}
          t={t}
          joining={joiningId === guild.id}
          disabled={joiningId !== null}
          onJoin={() => handleJoin(guild.id)}
        />
      ))}

      {list.hasNextPage && (
        <KsButton
          label={t('loadMore')}
          tone="neutral"
          busy={list.isFetchingNextPage}
          onPress={() => list.fetchNextPage()}
        />
      )}
      {list.isError && list.guilds.length > 0 && (
        <ErrorState text={t('directoryError')} onRetry={() => list.refetch()} />
      )}
    </View>
  );
};

const local = StyleSheet.create({
  section: { gap: 10 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  info: { flex: 1 },
  locked: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
    textAlign: 'right',
  },
});

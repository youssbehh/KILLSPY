import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { SectionLabel } from '../../components/ks/SectionLabel';
import { useAcceptFriendRequest, useDeleteFriendRequest, useFriends } from '../../hooks/useFriends';
import { extractApiError } from '../../api/client';
import type { FriendRequest, FriendsOverview } from '../../api/friends';
import { useFriendsT } from './strings';
import { ActionButton, Feedback, LIST_BOTTOM_PAD, PAD, PlayerRef, PlayerRow, StateBox } from './ui';

export const RequestsTab: React.FC<{ onOpenPlayer: (player: PlayerRef) => void }> = ({ onOpenPlayer }) => {
  const t = useFriendsT();
  const { data, isLoading, isError, refetch, isRefetching } = useFriends();
  const accept = useAcceptFriendRequest();
  const remove = useDeleteFriendRequest();
  const [error, setError] = useState<string | null>(null);

  const overview = data as FriendsOverview | undefined;
  const incoming: FriendRequest[] = overview?.incoming ?? [];
  const outgoing: FriendRequest[] = overview?.outgoing ?? [];

  const onError = (e: unknown) => setError(extractApiError(e).message);
  const handleAccept = (requestId: number) => {
    setError(null);
    accept.mutate(requestId, { onError });
  };
  const handleDelete = (requestId: number) => {
    setError(null);
    remove.mutate(requestId, { onError });
  };

  if (isLoading) return <StateBox kind="loading" />;
  if (isError && !overview) return <StateBox kind="error" onRetry={() => refetch()} />;

  const busy = accept.isPending || remove.isPending;
  const accepting = (id: number) => accept.isPending && accept.variables === id;
  const deleting = (id: number) => remove.isPending && remove.variables === id;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: LIST_BOTTOM_PAD }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={KS.primary} />
      }
    >
      <Feedback text={error} />

      <View style={styles.section}>
        <SectionLabel label={`${t('incoming')} · ${incoming.length}`} />
      </View>
      {incoming.length === 0 ? <Text style={styles.empty}>{t('incomingEmpty')}</Text> : null}
      {incoming.map((request) => {
        const name = request.user.username;
        return (
          <PlayerRow
            key={request.requestId}
            username={name}
            mmr={request.user.mmr}
            online={request.user.online}
            onPress={() => onOpenPlayer(request.user)}
            pressLabel={t('viewProfile', { name })}
          >
            <ActionButton
              label={t('accept')}
              accessibilityLabel={t('acceptLabel', { name })}
              tone="live"
              busy={accepting(request.requestId)}
              disabled={busy}
              onPress={() => handleAccept(request.requestId)}
            />
            <ActionButton
              label={t('decline')}
              accessibilityLabel={t('declineLabel', { name })}
              tone="neutral"
              busy={deleting(request.requestId)}
              disabled={busy}
              onPress={() => handleDelete(request.requestId)}
            />
          </PlayerRow>
        );
      })}

      <View style={styles.section}>
        <SectionLabel label={`${t('outgoing')} · ${outgoing.length}`} color={KS.inkMute} />
      </View>
      {outgoing.length === 0 ? <Text style={styles.empty}>{t('outgoingEmpty')}</Text> : null}
      {outgoing.map((request) => {
        const name = request.user.username;
        return (
          <PlayerRow
            key={request.requestId}
            username={name}
            mmr={request.user.mmr}
            onPress={() => onOpenPlayer(request.user)}
            pressLabel={t('viewProfile', { name })}
          >
            <ActionButton
              label={t('cancel')}
              accessibilityLabel={t('cancelRequestLabel', { name })}
              tone="neutral"
              busy={deleting(request.requestId)}
              disabled={busy}
              onPress={() => handleDelete(request.requestId)}
            />
          </PlayerRow>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: { paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 6 },
  empty: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoMd,
    color: KS.inkDim,
    paddingHorizontal: PAD,
    paddingVertical: 14,
  },
});

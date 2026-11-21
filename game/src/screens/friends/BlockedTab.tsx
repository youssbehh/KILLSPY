import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { useBlocked, useUnblockUser } from '../../hooks/useFriends';
import { extractApiError } from '../../api/client';
import { useFriendsT } from './strings';
import { ActionButton, Feedback, LIST_BOTTOM_PAD, PlayerRef, PlayerRow, StateBox } from './ui';

export const BlockedTab: React.FC = () => {
  const t = useFriendsT();
  const { data, isLoading, isError, refetch, isRefetching } = useBlocked();
  const unblock = useUnblockUser();
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const blocked: PlayerRef[] = (data as PlayerRef[] | undefined) ?? [];

  const handleUnblock = (player: PlayerRef) => {
    setFeedback(null);
    unblock.mutate(player.id, {
      onSuccess: () => {
        setFeedback({ text: t('unblocked', { name: player.username }), ok: true });
      },
      onError: (e) => setFeedback({ text: extractApiError(e).message, ok: false }),
    });
  };

  if (isLoading) return <StateBox kind="loading" />;
  if (isError && blocked.length === 0) return <StateBox kind="error" onRetry={() => refetch()} />;

  return (
    <>
      <Feedback text={feedback?.text ?? null} ok={feedback?.ok} />
      <FlatList
        data={blocked}
        keyExtractor={(player) => String(player.id)}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: LIST_BOTTOM_PAD }}
        ListEmptyComponent={<StateBox kind="empty" title={t('blockedEmpty')} />}
        renderItem={({ item }) => (
          <PlayerRow username={item.username}>
            <ActionButton
              label={t('unblock')}
              accessibilityLabel={t('unblockLabel', { name: item.username })}
              tone="neutral"
              busy={unblock.isPending && unblock.variables === item.id}
              disabled={unblock.isPending}
              onPress={() => handleUnblock(item)}
            />
          </PlayerRow>
        )}
      />
    </>
  );
};

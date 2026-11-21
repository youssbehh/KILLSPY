import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { useFriends } from '../../hooks/useFriends';
import { useInbox } from '../../hooks/useMessages';
import { useChallengeStore } from '../../stores/challengeStore';
import type { FriendsOverview, PlayerSummary } from '../../api/friends';
import type { ConversationSummary } from '../../api/messages';
import { FriendsT, useFriendsT } from './strings';
import { ChallengeBanner } from './ChallengeBanner';
import { ActionButton, CountBadge, LIST_BOTTOM_PAD, PlayerRef, PlayerRow, StateBox } from './ui';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const formatAgo = (iso: string, t: FriendsT): string => {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < MINUTE) return t('now');
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

interface Props {
  onOpenChat: (player: PlayerRef) => void;
  onOpenPlayer: (player: PlayerRef) => void;
}

export const FriendsTab: React.FC<Props> = ({ onOpenChat, onOpenPlayer }) => {
  const t = useFriendsT();
  const { data, isLoading, isError, refetch, isRefetching } = useFriends();
  const { data: inboxData } = useInbox();
  const challengeBusy = useChallengeStore((s) => s.outgoing !== null || s.incoming !== null);
  const [sendFailed, setSendFailed] = useState(false);

  const friends: PlayerSummary[] = (data as FriendsOverview | undefined)?.friends ?? [];
  const inbox: ConversationSummary[] = (inboxData as ConversationSummary[] | undefined) ?? [];
  const summaries = new Map<number, ConversationSummary>(inbox.map((s) => [s.friendId, s]));

  const handleChallenge = (friend: PlayerSummary) => {
    setSendFailed(false);
    useChallengeStore
      .getState()
      .sendChallenge({ id: friend.id, username: friend.username })
      .catch(() => setSendFailed(true));
  };

  if (isLoading) return <StateBox kind="loading" />;
  if (isError && friends.length === 0) return <StateBox kind="error" onRetry={() => refetch()} />;

  return (
    <>
      <ChallengeBanner sendFailed={sendFailed} onDismissError={() => setSendFailed(false)} />
      <FlatList
        data={friends}
        keyExtractor={(friend) => String(friend.id)}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: LIST_BOTTOM_PAD }}
        ListEmptyComponent={
          <StateBox kind="empty" title={t('friendsEmptyTitle')} hint={t('friendsEmptyHint')} />
        }
        renderItem={({ item }) => {
          const summary = summaries.get(item.id);
          const unread = summary?.unreadCount ?? 0;
          const name = item.username;
          return (
            <PlayerRow
              username={name}
              mmr={item.mmr}
              online={item.online}
              subtitle={summary?.lastMessage ?? undefined}
              meta={summary?.lastAt ? formatAgo(summary.lastAt, t) : undefined}
              onPress={() => onOpenChat(item)}
              pressLabel={
                unread > 0
                  ? `${t('openConversation', { name })}, ${t('unreadCount', { count: unread })}`
                  : t('openConversation', { name })
              }
            >
              <CountBadge count={unread} />
              {item.online ? (
                <ActionButton
                  label={t('challenge')}
                  accessibilityLabel={t('challengeLabel', { name })}
                  tone="live"
                  disabled={challengeBusy}
                  onPress={() => handleChallenge(item)}
                />
              ) : null}
              <ActionButton
                label="⋯"
                accessibilityLabel={t('moreActions', { name })}
                tone="neutral"
                onPress={() => onOpenPlayer(item)}
              />
            </PlayerRow>
          );
        }}
      />
    </>
  );
};

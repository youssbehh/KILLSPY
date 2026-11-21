import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useBlockUser,
  useRemoveFriend,
  useSendFriendRequest,
  useUnblockUser,
} from '../../hooks/useFriends';
import { extractApiError } from '../../api/client';
import type { Relation } from '../../api/friends';
import { useFriendsT } from './strings';
import { ReportForm } from './ReportForm';
import { ActionButton, ConfirmButton, Feedback, PlayerRef } from './ui';

interface Props {
  player: PlayerRef;
  /** null when the profile could not be loaded: only block / report stay available. */
  relation: Relation | null;
  onMessage: (player: PlayerRef) => void;
  /** The player is no longer a friend (removed or blocked). */
  onUnfriended: (player: PlayerRef) => void;
}

export const PlayerActions: React.FC<Props> = ({ player, relation, onMessage, onUnfriended }) => {
  const t = useFriendsT();
  const sendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [reporting, setReporting] = useState(false);

  if (relation === 'self') return null;

  const name = player.username;
  const busy = sendRequest.isPending || removeFriend.isPending || block.isPending || unblock.isPending;
  const onError = (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false });
  const ok = (text: string) => setFeedback({ text, ok: true });

  const handleAdd = () => {
    setFeedback(null);
    sendRequest.mutate(name, {
      onSuccess: (result) => ok(t(result.status === 'accepted' ? 'requestAccepted' : 'requestSent', { name })),
      onError,
    });
  };
  const handleRemove = () => {
    setFeedback(null);
    removeFriend.mutate(player.id, {
      onSuccess: () => {
        ok(t('removed', { name }));
        onUnfriended(player);
      },
      onError,
    });
  };
  const handleBlock = () => {
    setFeedback(null);
    block.mutate(player.id, {
      onSuccess: () => {
        ok(t('blocked', { name }));
        onUnfriended(player);
      },
      onError,
    });
  };
  const handleUnblock = () => {
    setFeedback(null);
    unblock.mutate(player.id, { onSuccess: () => ok(t('unblocked', { name })), onError });
  };

  return (
    <View style={styles.actions}>
      <Feedback text={feedback?.text ?? null} ok={feedback?.ok} />

      {relation === 'friend' ? (
        <ActionButton label={t('message')} block disabled={busy} onPress={() => onMessage(player)} />
      ) : null}
      {relation === 'none' ? (
        <ActionButton
          label={`+ ${t('add')}`}
          accessibilityLabel={t('addLabel', { name })}
          block
          busy={sendRequest.isPending}
          onPress={handleAdd}
        />
      ) : null}
      {relation === 'incoming' ? (
        <ActionButton
          label={t('accept')}
          accessibilityLabel={t('acceptLabel', { name })}
          tone="live"
          block
          busy={sendRequest.isPending}
          onPress={handleAdd}
        />
      ) : null}
      {relation === 'friend' ? (
        <ConfirmButton
          label={t('removeFriend')}
          block
          busy={removeFriend.isPending}
          disabled={busy}
          onConfirm={handleRemove}
        />
      ) : null}
      {relation === 'blocked' ? (
        <ActionButton
          label={t('unblock')}
          accessibilityLabel={t('unblockLabel', { name })}
          tone="neutral"
          block
          busy={unblock.isPending}
          onPress={handleUnblock}
        />
      ) : (
        <ConfirmButton label={t('block')} block busy={block.isPending} disabled={busy} onConfirm={handleBlock} />
      )}

      {reporting ? (
        <ReportForm player={player} onCancel={() => setReporting(false)} />
      ) : (
        <ActionButton label={t('report')} tone="neutral" block onPress={() => setReporting(true)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: { gap: 8, marginTop: 12 },
});

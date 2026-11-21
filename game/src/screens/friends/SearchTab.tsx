import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES, ls } from '../../theme/typography';
import { usePlayerSearch, useSendFriendRequest } from '../../hooks/useFriends';
import { extractApiError } from '../../api/client';
import type { PlayerSearchResult } from '../../api/friends';
import { FriendsKey, useFriendsT } from './strings';
import { ActionButton, Feedback, LIST_BOTTOM_PAD, PAD, PlayerRef, PlayerRow, StateBox, TOUCH } from './ui';

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;
const MAX_USERNAME = 20;

const useDebounced = (value: string, delayMs: number): string => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
};

/** Relations that only show a status tag instead of an action. */
const STATUS_TAG: Partial<Record<PlayerSearchResult['relation'], FriendsKey>> = {
  outgoing: 'pending',
  friend: 'alreadyFriend',
  blocked: 'blockedTag',
  blocked_by: 'unavailable',
};

export const SearchTab: React.FC<{ onOpenPlayer: (player: PlayerRef) => void }> = ({ onOpenPlayer }) => {
  const t = useFriendsT();
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const debounced = useDebounced(query.trim(), DEBOUNCE_MS);
  const { data, isLoading, isError, refetch } = usePlayerSearch(debounced);
  const sendRequest = useSendFriendRequest();

  const exact = query.trim();
  const searching = debounced.length >= MIN_QUERY;
  const results: PlayerSearchResult[] = ((data as PlayerSearchResult[] | undefined) ?? []).filter(
    (player) => player.relation !== 'self',
  );

  /** Sends a request to this exact username (accepts the pending one if the player already asked). */
  const handleAdd = (username: string) => {
    if (!username || sendRequest.isPending) return;
    setFeedback(null);
    sendRequest.mutate(username, {
      onSuccess: (result) =>
        setFeedback({
          text: t(result.status === 'accepted' ? 'requestAccepted' : 'requestSent', { name: username }),
          ok: true,
        }),
      onError: (e) => setFeedback({ text: extractApiError(e).message, ok: false }),
    });
  };

  const sendingTo = (username: string) => sendRequest.isPending && sendRequest.variables === username;

  return (
    <>
      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleAdd(exact)}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={KS.inkDim}
          accessibilityLabel={t('searchLabel')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          maxLength={MAX_USERNAME}
        />
        <ActionButton
          label={`+ ${t('addExact')}`}
          accessibilityLabel={t('addExactLabel', { name: exact })}
          disabled={exact.length === 0}
          busy={sendingTo(exact)}
          onPress={() => handleAdd(exact)}
        />
      </View>
      <Feedback text={feedback?.text ?? null} ok={feedback?.ok} />

      {!searching ? (
        <StateBox kind="empty" hint={t('searchHint')} />
      ) : isLoading ? (
        <StateBox kind="loading" />
      ) : isError ? (
        <StateBox kind="error" onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(player) => String(player.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: LIST_BOTTOM_PAD }}
          ListEmptyComponent={<StateBox kind="empty" title={t('searchEmpty')} />}
          renderItem={({ item }) => {
            const name = item.username;
            const tag = STATUS_TAG[item.relation];
            return (
              <PlayerRow
                username={name}
                mmr={item.mmr}
                online={item.online}
                onPress={() => onOpenPlayer(item)}
                pressLabel={t('viewProfile', { name })}
              >
                {tag ? (
                  <Text style={styles.tag}>{t(tag)}</Text>
                ) : item.relation === 'incoming' ? (
                  <ActionButton
                    label={t('accept')}
                    accessibilityLabel={t('acceptLabel', { name })}
                    tone="live"
                    busy={sendingTo(name)}
                    disabled={sendRequest.isPending}
                    onPress={() => handleAdd(name)}
                  />
                ) : (
                  <ActionButton
                    label={`+ ${t('add')}`}
                    accessibilityLabel={t('addLabel', { name })}
                    busy={sendingTo(name)}
                    disabled={sendRequest.isPending}
                    onPress={() => handleAdd(name)}
                  />
                )}
              </PlayerRow>
            );
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingBottom: 8 },
  input: {
    flex: 1,
    height: TOUCH,
    backgroundColor: KS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 12,
    fontFamily: TYPO.mono,
    fontSize: SIZES.bodySm,
    color: KS.ink,
  },
  tag: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    color: KS.inkDim,
    letterSpacing: ls(SIZES.monoSm, 0.18),
    paddingHorizontal: 4,
  },
});

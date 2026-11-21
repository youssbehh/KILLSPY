import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { GuildMessageDTO } from '../../api/guilds';
import { extractApiError } from '../../api/client';
import { useGuildChat, usePostGuildMessage } from '../../hooks/useGuilds';
import { GUILD_LIMITS, useHqT } from './strings';
import {
  EmptyState, ErrorState, Feedback, FeedbackLine, KsButton, LoadingState, PAD, styles as ui, tint,
} from './ui';

interface Props {
  myUserId: number | undefined;
  bottomPad: number;
}

const COUNTER_THRESHOLD = 400;

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Bubble: React.FC<{ message: GuildMessageDTO; mine: boolean }> = ({ message, mine }) => (
  <View style={[local.bubble, mine ? local.bubbleMine : local.bubbleOther]}>
    <Text style={[local.sender, mine && { color: KS.live }]} numberOfLines={1}>
      {message.senderUsername.toUpperCase()} · {formatTime(message.sentAt)}
    </Text>
    <Text style={local.content}>{message.content}</Text>
  </View>
);

/**
 * Guild chat. The list is inverted (newest first in the data, drawn at the bottom) so the newest
 * message stays in view without manual scrolling; "load older" is the footer, i.e. the visual top.
 */
export const ChatTab: React.FC<Props> = ({ myUserId, bottomPad }) => {
  const t = useHqT();
  const chat = useGuildChat(true);
  const post = usePostGuildMessage();
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const messages: GuildMessageDTO[] = chat.messages;
  const newestFirst = [...messages].reverse();
  const content = draft.trim();

  const handleSend = () => {
    if (!content || post.isPending) return;
    setFeedback(null);
    post.mutate(content, {
      onSuccess: () => setDraft(''),
      onError: (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false }),
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <View style={local.container}>
      {!hasMessages ? (
        <View style={local.placeholder}>
          {chat.isLoading && <LoadingState />}
          {chat.isError && <ErrorState text={t('chatError')} onRetry={() => chat.refetch()} />}
          {!chat.isLoading && !chat.isError && <EmptyState text={t('chatEmpty')} />}
        </View>
      ) : (
        <FlatList
          inverted
          data={newestFirst}
          keyExtractor={(message) => String(message.id)}
          renderItem={({ item }) => <Bubble message={item} mine={item.senderId === myUserId} />}
          contentContainerStyle={local.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            chat.hasNextPage ? (
              <KsButton
                label={t('chatLoadOlder')}
                tone="neutral"
                busy={chat.isFetchingNextPage}
                onPress={() => chat.fetchNextPage()}
                style={local.older}
              />
            ) : null
          }
          ListHeaderComponent={
            chat.isError ? <ErrorState text={t('chatError')} onRetry={() => chat.refetch()} /> : null
          }
        />
      )}

      <View style={[local.composer, { paddingBottom: bottomPad }]}>
        <FeedbackLine feedback={feedback} />
        <View style={local.inputRow}>
          <TextInput
            style={[ui.input, local.input]}
            placeholder={t('chatPlaceholder')}
            placeholderTextColor={KS.inkFaint}
            accessibilityLabel={t('chatInputA11y')}
            value={draft}
            onChangeText={setDraft}
            maxLength={GUILD_LIMITS.messageMax}
            multiline
          />
          <KsButton
            label={t('chatSend')}
            tone="primary"
            filled
            disabled={!content}
            busy={post.isPending}
            onPress={handleSend}
          />
        </View>
        {draft.length >= COUNTER_THRESHOLD && (
          <Text style={local.counter}>{draft.length}/{GUILD_LIMITS.messageMax}</Text>
        )}
      </View>
    </View>
  );
};

const local = StyleSheet.create({
  container: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', paddingHorizontal: PAD },
  list: { paddingHorizontal: PAD, paddingVertical: 12, gap: 8 },
  older: { alignSelf: 'center', marginTop: 8 },
  bubble: { maxWidth: '82%', paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, gap: 2 },
  bubbleMine: { alignSelf: 'flex-end', borderColor: KS.hair, backgroundColor: tint(KS.primary) },
  bubbleOther: { alignSelf: 'flex-start', borderColor: KS.hairSoft, backgroundColor: KS.surface },
  sender: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.14,
  },
  content: { color: KS.ink, fontFamily: TYPO.ui, fontSize: SIZES.bodyLg },
  composer: {
    paddingHorizontal: PAD,
    paddingTop: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: KS.hairSoft,
    backgroundColor: KS.bg,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, maxHeight: 120 },
  counter: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, textAlign: 'right' },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { KS } from '../../theme/colors';
import { TYPO, SIZES, ls } from '../../theme/typography';
import { HexAvatar } from '../../components/ks/HexAvatar';
import { useAuthStore } from '../../stores/authStore';
import { useFriends } from '../../hooks/useFriends';
import { INBOX_KEY, useConversation, useSendMessage } from '../../hooks/useMessages';
import { extractApiError } from '../../api/client';
import type { FriendsOverview, PlayerSummary } from '../../api/friends';
import type { MessageDTO } from '../../api/messages';
import { rankTierName } from '../../game/rankDisplay';
import { useFriendsT } from './strings';
import { ActionButton, Feedback, PAD, PlayerRef, StateBox, TAB_BAR_HEIGHT, TOUCH } from './ui';
import { VerifyEmailBanner } from '@/src/components/ks/VerifyEmailBanner';

const MAX_MESSAGE = 500;

const formatClock = (iso: string): string => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** On iOS the keyboard covers the tab bar, so the room kept for it must go while typing. */
const useIosKeyboardOpen = (): boolean => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
};

const Bubble: React.FC<{ message: MessageDTO; mine: boolean }> = ({ message, mine }) => (
  <View style={[styles.bubbleWrap, mine ? styles.wrapMine : styles.wrapTheirs]}>
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.bubbleText, mine && { color: KS.onPrimary }]}>{message.content}</Text>
    </View>
    <Text style={styles.clock}>{formatClock(message.sentAt)}</Text>
  </View>
);

interface Props {
  partner: PlayerRef;
  onBack: () => void;
  onOpenPlayer: (player: PlayerRef) => void;
}

export const ConversationView: React.FC<Props> = ({ partner, onBack, onOpenPlayer }) => {
  const t = useFriendsT();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const keyboardOpen = useIosKeyboardOpen();

  const { data: friendsData } = useFriends();
  const friend: PlayerSummary | undefined = (friendsData as FriendsOverview | undefined)?.friends.find(
    (f) => f.id === partner.id,
  );
  const online = friend?.online ?? false;

  const { messages, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useConversation(partner.id);
  const send = useSendMessage(partner.id);
  const newestId: number | null = messages.length > 0 ? messages[messages.length - 1].id : null;

  // Reading the conversation marks it as read on the server: refresh the unread badges.
  useEffect(() => {
    if (newestId !== null) queryClient.invalidateQueries({ queryKey: INBOX_KEY });
  }, [newestId, queryClient]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || send.isPending) return;
    setSendError(null);
    setText('');
    send.mutate(content, {
      onError: (e) => {
        setSendError(extractApiError(e).message);
        // Give the message back so it is not lost.
        setText((current) => current || content);
      },
    });
  };

  // The list is inverted (newest first, drawn from the bottom): it opens on the latest
  // message and stays there when new ones arrive or older ones are loaded.
  const newestFirst = [...messages].reverse();

  const canSend = text.trim().length > 0 && !send.isPending;
  const bottomRoom = keyboardOpen ? 0 : TAB_BAR_HEIGHT + Math.max(insets.bottom, 8);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingBottom: bottomRoom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => onOpenPlayer(partner)}
          accessibilityRole="button"
          accessibilityLabel={t('viewProfile', { name: partner.username })}
          style={({ pressed }) => [styles.headerMain, pressed && styles.pressed]}
        >
          <HexAvatar size={40} tier={rankTierName(friend?.mmr ?? 0)} initials={partner.username} live={online} />
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {partner.username}
            </Text>
            <Text style={[styles.headerStatus, { color: online ? KS.live : KS.inkDim }]}>
              {online ? `● ${t('online')}` : `○ ${t('offline')}`}
            </Text>
          </View>
        </Pressable>
      </View>

      {isLoading ? (
        <StateBox kind="loading" />
      ) : isError && messages.length === 0 ? (
        <StateBox kind="error" onRetry={() => refetch()} />
      ) : messages.length === 0 ? (
        <StateBox kind="empty" hint={t('conversationEmpty')} />
      ) : (
        <FlatList
          inverted
          data={newestFirst}
          keyExtractor={(message) => String(message.id)}
          renderItem={({ item }) => <Bubble message={item} mine={item.senderId === myId} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          // Footer of an inverted list = visual top, where older messages are loaded.
          ListFooterComponent={
            hasNextPage ? (
              <View style={styles.older}>
                <ActionButton
                  label={t('loadOlder')}
                  tone="neutral"
                  busy={isFetchingNextPage}
                  onPress={() => fetchNextPage()}
                />
              </View>
            ) : undefined
          }
        />
      )}

      <Feedback text={sendError} />
      <VerifyEmailBanner compact />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={t('messagePlaceholder')}
          placeholderTextColor={KS.inkDim}
          accessibilityLabel={t('messageLabel', { name: partner.username })}
          multiline
          maxLength={MAX_MESSAGE}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('send')}
          accessibilityState={{ disabled: !canSend, busy: send.isPending }}
          style={({ pressed }) => [styles.send, !canSend && styles.sendOff, pressed && styles.pressed]}
        >
          {send.isPending ? (
            <ActivityIndicator size="small" color={KS.ink} />
          ) : (
            <Text style={[styles.sendGlyph, !canSend && { color: KS.inkDim }]}>➤</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  pressed: { opacity: 0.7 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: KS.divider,
  },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontFamily: TYPO.display, fontSize: SIZES.titleLg, color: KS.primary },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  headerText: { flex: 1 },
  headerName: { fontFamily: TYPO.uiBold, fontSize: SIZES.bodyLg, color: KS.ink, letterSpacing: 0.5 },
  headerStatus: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: ls(SIZES.monoSm, 0.14), marginTop: 2 },

  list: { flexGrow: 1, paddingVertical: 12 },
  older: { alignItems: 'center', paddingBottom: 12 },
  bubbleWrap: { marginHorizontal: PAD, marginVertical: 3, maxWidth: '78%', gap: 3 },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: KS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: TYPO.ui, fontSize: SIZES.body, color: KS.inkMute, lineHeight: 20 },
  clock: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, color: KS.inkDim, marginHorizontal: 4 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: PAD,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: KS.hairSoft,
  },
  input: {
    flex: 1,
    minHeight: TOUCH,
    maxHeight: 110,
    backgroundColor: KS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    color: KS.ink,
  },
  send: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: KS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { backgroundColor: KS.surface },
  sendGlyph: { fontFamily: TYPO.uiBold, fontSize: SIZES.titleSm, color: KS.onPrimary },
});

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { KS } from '@/src/theme/colors';
import { TYPO } from '@/src/theme/typography';
import { useAuthStore } from '@/src/stores/authStore';
import { useFriends, useAddFriend } from '@/src/hooks/useFriends';
import { useInbox, useConversation, useSendMessage } from '@/src/hooks/useMessages';
import type { FriendRecord } from '@/src/api/friends';
import type { ConversationSummary, MessageDTO } from '@/src/api/messages';

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// ── Hex Avatar ────────────────────────────────────────────────────────────────

function HexAvatar({ name, size = 42, online }: { name: string; size?: number; online?: boolean }) {
  return (
    <View style={[avStyles.wrap, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={[avStyles.init, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
      {online != null && (
        <View
          style={[
            avStyles.dot,
            {
              backgroundColor: online ? KS.live : KS.inkDim,
              shadowColor: online ? KS.live : 'transparent',
            },
          ]}
        />
      )}
    </View>
  );
}

const avStyles = StyleSheet.create({
  wrap: {
    backgroundColor: KS.surface,
    borderWidth: 1.5,
    borderColor: KS.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  init: {
    fontFamily: TYPO.display,
    color: KS.primary,
    letterSpacing: 1,
  },
  dot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: KS.bg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});

// ── Friend row ────────────────────────────────────────────────────────────────

function FriendRow({
  friend,
  summary,
  onPress,
}: {
  friend: FriendRecord;
  summary?: ConversationSummary;
  onPress: () => void;
}) {
  const name = friend.Friend.Username;
  const preview = summary?.lastMessage ?? null;
  const unread = summary?.unreadCount ?? 0;
  const lastAt = summary?.lastAt ?? null;
  const online = friend.Connected;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [rowStyles.row, pressed && { opacity: 0.75 }]}
    >
      <HexAvatar name={name} size={44} online={online} />

      <View style={rowStyles.body}>
        <View style={rowStyles.top}>
          <Text style={rowStyles.username}>{name}</Text>
          {lastAt && <Text style={rowStyles.time}>{formatTime(lastAt)}</Text>}
        </View>
        <Text style={rowStyles.preview} numberOfLines={1}>
          {preview ?? 'Démarrer une conversation…'}
        </Text>
      </View>

      {unread > 0 && (
        <View style={rowStyles.badge}>
          <Text style={rowStyles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: KS.divider,
  },
  body: { flex: 1, gap: 3 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    fontFamily: TYPO.uiBold,
    fontSize: 14,
    color: KS.ink,
    letterSpacing: 0.4,
  },
  time: {
    fontFamily: TYPO.mono,
    fontSize: 11,
    color: KS.inkDim,
  },
  preview: {
    fontFamily: TYPO.ui,
    fontSize: 13,
    color: KS.inkDim,
  },
  badge: {
    backgroundColor: KS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    shadowColor: KS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 4,
  },
  badgeText: {
    fontFamily: TYPO.monoBold,
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
});

// ── Add friend bar ─────────────────────────────────────────────────────────────

function AddFriendBar() {
  const [value, setValue] = useState('');
  const { mutate, isPending, isSuccess, isError } = useAddFriend();

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    mutate(v, { onSuccess: () => setValue('') });
  };

  return (
    <View style={addStyles.wrap}>
      <TextInput
        style={addStyles.input}
        placeholder="Ajouter par pseudo…"
        placeholderTextColor={KS.inkDim}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        returnKeyType="send"
        autoCapitalize="none"
      />
      <Pressable
        onPress={submit}
        disabled={isPending}
        style={({ pressed }) => [addStyles.btn, pressed && { opacity: 0.7 }]}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={KS.primary} />
        ) : (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"
              fill={KS.inkDim}
            />
          </Svg>
        )}
        <Text style={addStyles.btnText}>
          {isPending ? '' : isSuccess ? 'ENVOYÉ ✓' : '+AJOUTER'}
        </Text>
      </Pressable>
      {isError && (
        <Text style={addStyles.error}>Pseudo introuvable</Text>
      )}
    </View>
  );
}

const addStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: KS.hairSoft,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: KS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 12,
    fontFamily: TYPO.mono,
    fontSize: 13,
    color: KS.ink,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hair,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: {
    fontFamily: TYPO.display,
    fontSize: 11,
    color: KS.primary,
    letterSpacing: 1.2,
  },
  error: {
    position: 'absolute',
    bottom: -18,
    left: 20,
    fontFamily: TYPO.mono,
    fontSize: 11,
    color: KS.danger,
  },
});

// ── Message bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg, isMine }: { msg: MessageDTO; isMine: boolean }) {
  return (
    <View style={[bubbleStyles.wrap, isMine ? bubbleStyles.wrapRight : bubbleStyles.wrapLeft]}>
      <View style={[bubbleStyles.bubble, isMine ? bubbleStyles.bubbleMine : bubbleStyles.bubbleTheirs]}>
        <Text style={[bubbleStyles.text, isMine && bubbleStyles.textMine]}>{msg.content}</Text>
      </View>
      <Text style={[bubbleStyles.ts, isMine && bubbleStyles.tsRight]}>{formatTimestamp(msg.sentAt)}</Text>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginVertical: 3,
    maxWidth: '78%',
    gap: 3,
  },
  wrapRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapLeft:  { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleMine: {
    backgroundColor: KS.primary,
    borderBottomRightRadius: 4,
    shadowColor: KS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleTheirs: {
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: TYPO.ui,
    fontSize: 14,
    color: KS.inkMute,
    lineHeight: 20,
  },
  textMine: {
    color: '#fff',
  },
  ts: {
    fontFamily: TYPO.mono,
    fontSize: 10,
    color: KS.inkDim,
    marginHorizontal: 4,
  },
  tsRight: {
    alignSelf: 'flex-end',
  },
});

// ── Conversation view ─────────────────────────────────────────────────────────

function ConversationView({
  friend,
  onBack,
}: {
  friend: FriendRecord;
  onBack: () => void;
}) {
  const me = useAuthStore((s) => s.user);
  const partnerId = friend.Friend.ID_User;
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);

  const { data: messages, isLoading } = useConversation(partnerId);
  const { mutate: send, isPending: sending } = useSendMessage(partnerId);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    send(content);
  }, [text, sending, send]);

  const sorted = messages ? [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  ) : [];

  return (
    <KeyboardAvoidingView
      style={cvStyles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={cvStyles.header}>
        <Pressable onPress={onBack} style={cvStyles.backBtn} hitSlop={12}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H20c.55 0 1-.45 1-1s-.45-1-1-1z"
              fill={KS.primary}
            />
          </Svg>
        </Pressable>
        <HexAvatar name={friend.Friend.Username} size={36} online={friend.Connected} />
        <View>
          <Text style={cvStyles.headerName}>{friend.Friend.Username}</Text>
          <Text style={cvStyles.headerStatus}>
            {friend.Connected ? '● EN LIGNE' : '○ HORS LIGNE'}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={cvStyles.divider} />

      {/* Messages */}
      {isLoading ? (
        <View style={cvStyles.center}>
          <ActivityIndicator color={KS.primary} />
        </View>
      ) : sorted.length === 0 ? (
        <View style={cvStyles.center}>
          <Text style={cvStyles.emptyText}>Aucun message — commencez la conversation</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={sorted}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <Bubble msg={item} isMine={item.senderId === me?.id} />
          )}
          contentContainerStyle={cvStyles.msgList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={cvStyles.inputRow}>
        <TextInput
          style={cvStyles.input}
          placeholder="Message…"
          placeholderTextColor={KS.inkDim}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={({ pressed }) => [
            cvStyles.sendBtn,
            (!text.trim() || sending) && cvStyles.sendBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                fill={text.trim() ? '#fff' : KS.inkDim}
              />
            </Svg>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const cvStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: KS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontFamily: TYPO.uiBold,
    fontSize: 15,
    color: KS.ink,
    letterSpacing: 0.5,
  },
  headerStatus: {
    fontFamily: TYPO.mono,
    fontSize: 10,
    color: KS.live,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: KS.divider,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: TYPO.mono,
    fontSize: 13,
    color: KS.inkDim,
    textAlign: 'center',
    maxWidth: 240,
  },
  msgList: {
    paddingVertical: 12,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: KS.hairSoft,
    backgroundColor: KS.bg,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: KS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: TYPO.ui,
    fontSize: 14,
    color: KS.ink,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: KS.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
});

// ── Friends list view ─────────────────────────────────────────────────────────

function FriendsList({ onSelect }: { onSelect: (f: FriendRecord) => void }) {
  const { data: friends, isLoading } = useFriends();
  const { data: inbox } = useInbox();

  const inboxMap = new Map<number, ConversationSummary>(
    (inbox ?? []).map((s: ConversationSummary) => [s.friendId, s])
  );

  const activeFriends = (friends ?? []).filter((f: FriendRecord) => !f.Blocked);

  if (isLoading) {
    return (
      <View style={listStyles.center}>
        <ActivityIndicator color={KS.primary} size="large" />
      </View>
    );
  }

  if (activeFriends.length === 0) {
    return (
      <View style={listStyles.center}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
          <Path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke={KS.inkDim}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={listStyles.emptyTitle}>AUCUN CONTACT</Text>
        <Text style={listStyles.emptyHint}>Ajoutez des agents via leur pseudo</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activeFriends}
      keyExtractor={(f) => String(f.ID_Friendship)}
      renderItem={({ item }) => (
        <FriendRow
          friend={item}
          summary={inboxMap.get(item.Friend.ID_User)}
          onPress={() => onSelect(item)}
        />
      )}
      contentContainerStyle={{ paddingBottom: 120 }}
    />
  );
}

const listStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: TYPO.display,
    fontSize: 18,
    color: KS.inkDim,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  emptyHint: {
    fontFamily: TYPO.mono,
    fontSize: 12,
    color: KS.inkFaint,
    textAlign: 'center',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<FriendRecord | null>(null);

  return (
    <View style={[mainStyles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {selected ? (
        <ConversationView
          friend={selected}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          {/* Screen header */}
          <View style={mainStyles.header}>
            <View>
              <Text style={mainStyles.eyebrow}>RÉSEAU</Text>
              <Text style={mainStyles.title}>CONTACTS</Text>
            </View>
            {/* Unread total badge */}
            <TotalUnreadBadge />
          </View>

          {/* Add friend */}
          <AddFriendBar />

          {/* Friends list */}
          <FriendsList onSelect={setSelected} />
        </>
      )}
    </View>
  );
}

function TotalUnreadBadge() {
  const { data: inbox } = useInbox();
  const total = (inbox ?? []).reduce((acc: number, s: ConversationSummary) => acc + s.unreadCount, 0);
  if (total === 0) return null;
  return (
    <View style={mainStyles.totalBadge}>
      <Text style={mainStyles.totalBadgeText}>{total > 99 ? '99+' : total}</Text>
    </View>
  );
}

const mainStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: TYPO.mono,
    fontSize: 10,
    color: KS.primary,
    letterSpacing: 3,
    marginBottom: 2,
  },
  title: {
    fontFamily: TYPO.display,
    fontSize: 28,
    color: KS.ink,
    letterSpacing: 4,
  },
  totalBadge: {
    backgroundColor: KS.primary,
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: KS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  totalBadgeText: {
    fontFamily: TYPO.monoBold,
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
});

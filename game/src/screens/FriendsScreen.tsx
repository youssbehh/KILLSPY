import React, { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '../theme/colors';
import { TYPO, SIZES, ls } from '../theme/typography';
import { TopoBg } from '../components/ks/TopoBg';
import { PrimaryButton } from '../components/ks/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { useFriends } from '../hooks/useFriends';
import { useInbox } from '../hooks/useMessages';
import type { FriendsOverview } from '../api/friends';
import type { ConversationSummary } from '../api/messages';
import { FriendsKey, useFriendsT } from './friends/strings';
import { FriendsTab } from './friends/FriendsTab';
import { RequestsTab } from './friends/RequestsTab';
import { SearchTab } from './friends/SearchTab';
import { BlockedTab } from './friends/BlockedTab';
import { ConversationView } from './friends/ConversationView';
import { PlayerSheet } from './friends/PlayerSheet';
import { CountBadge, LIST_BOTTOM_PAD, PAD, PlayerRef, TOUCH } from './friends/ui';

const TABS = ['friends', 'requests', 'search', 'blocked'] as const;
type TabId = (typeof TABS)[number];

const TAB_LABEL: Record<TabId, FriendsKey> = {
  friends: 'tabFriends',
  requests: 'tabRequests',
  search: 'tabSearch',
  blocked: 'tabBlocked',
};

/** Guests have no social features: point them to the account creation in Settings. */
const GuestPrompt: React.FC = () => {
  const t = useFriendsT();
  const router = useRouter();
  return (
    <View style={styles.guest}>
      <Text style={styles.guestTitle}>{t('guestTitle')}</Text>
      <Text style={styles.guestBody}>{t('guestBody')}</Text>
      <PrimaryButton label={t('guestCta')} size="medium" onPress={() => router.push('/settings')} />
    </View>
  );
};

export const FriendsScreen: React.FC = () => {
  const t = useFriendsT();
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const [tab, setTab] = useState<TabId>('friends');
  const [chat, setChat] = useState<PlayerRef | null>(null);
  const [sheet, setSheet] = useState<PlayerRef | null>(null);

  const { data: friendsData } = useFriends();
  const { data: inboxData } = useInbox();
  const pendingRequests = (friendsData as FriendsOverview | undefined)?.incoming.length ?? 0;
  const unread = ((inboxData as ConversationSummary[] | undefined) ?? []).reduce(
    (total, summary) => total + summary.unreadCount,
    0,
  );

  const openPlayer = (player: PlayerRef) => setSheet({ id: player.id, username: player.username });
  const openChat = (player: PlayerRef) => {
    setSheet(null);
    setChat({ id: player.id, username: player.username });
  };
  const handleUnfriended = (player: PlayerRef) => {
    if (chat?.id === player.id) setChat(null);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <TopoBg />

      {chat && !isGuest ? (
        <ConversationView partner={chat} onBack={() => setChat(null)} onOpenPlayer={openPlayer} />
      ) : (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{`// ${t('eyebrow')}`}</Text>
              <Text style={styles.title} accessibilityRole="header">
                {t('title')}
              </Text>
            </View>
            <View accessible accessibilityLabel={unread > 0 ? t('unreadTotal', { count: unread }) : undefined}>
              <CountBadge count={unread} max={99} />
            </View>
          </View>

          {isGuest ? (
            <GuestPrompt />
          ) : (
            <>
              <View style={styles.tabs} accessibilityRole="tablist">
                {TABS.map((id) => {
                  const selected = tab === id;
                  const label = t(TAB_LABEL[id]);
                  const count = id === 'requests' ? pendingRequests : 0;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setTab(id)}
                      accessibilityRole="tab"
                      accessibilityLabel={count > 0 ? t('tabBadge', { label, count }) : label}
                      accessibilityState={{ selected }}
                      style={[styles.tab, selected && styles.tabOn]}
                    >
                      <Text style={[styles.tabText, selected && styles.tabTextOn]} numberOfLines={1}>
                        {label}
                      </Text>
                      <CountBadge count={count} />
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.body}>
                {tab === 'friends' ? <FriendsTab onOpenChat={openChat} onOpenPlayer={openPlayer} /> : null}
                {tab === 'requests' ? <RequestsTab onOpenPlayer={openPlayer} /> : null}
                {tab === 'search' ? <SearchTab onOpenPlayer={openPlayer} /> : null}
                {tab === 'blocked' ? <BlockedTab /> : null}
              </View>
            </>
          )}
        </>
      )}

      {sheet && !isGuest ? (
        <PlayerSheet
          key={sheet.id}
          player={sheet}
          onClose={() => setSheet(null)}
          onMessage={openChat}
          onUnfriended={handleUnfriended}
        />
      ) : null}
    </View>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: KS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingTop: 12,
    paddingBottom: 12,
  },
  eyebrow: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    color: KS.inkDim,
    letterSpacing: ls(SIZES.monoSm, 0.18),
  },
  title: {
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    color: KS.ink,
    letterSpacing: ls(SIZES.titleLg, 0.04),
  },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: PAD, marginBottom: 10 },
  tab: {
    flex: 1,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: KS.hairSoft,
  },
  tabOn: { backgroundColor: KS.primary, borderColor: KS.primary },
  tabText: { flexShrink: 1, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, color: KS.inkDim },
  tabTextOn: { color: KS.ink },
  body: { flex: 1 },
  guest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
    paddingBottom: LIST_BOTTOM_PAD,
  },
  guestTitle: {
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    color: KS.alert,
    letterSpacing: ls(SIZES.titleMd, 0.08),
    textAlign: 'center',
  },
  guestBody: {
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodyLg,
    color: KS.inkMute,
    textAlign: 'center',
    lineHeight: 22,
  },
});

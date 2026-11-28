import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { GlassCard } from '../../components/ks';
import { GuildRole, MyGuild } from '../../api/guilds';
import { HqStringKey, useHqT } from './strings';
import { ChatTab } from './ChatTab';
import { ManageTab } from './ManageTab';
import { MembersTab } from './MembersTab';
import {
  MIN_TOUCH, PAD, ROLE_COLOR, ROLE_KEY, TAB_BAR_HEIGHT, TagChip, useIosKeyboardVisible,
} from './ui';

interface Props {
  guild: MyGuild;
  myUserId: number | undefined;
  cardWidth: number;
}

const TABS = ['members', 'chat', 'manage'] as const;
type TabId = typeof TABS[number];
const TAB_LABEL: Record<TabId, HqStringKey> = { members: 'tabMembers', chat: 'tabChat', manage: 'tabManage' };

const SCROLL_BOTTOM_PAD = 100;
const KEYBOARD_GAP = 8;

/** The player's guild: banner, then members / chat / manage tabs. */
export const GuildView: React.FC<Props> = ({ guild, myUserId, cardWidth }) => {
  const t = useHqT();
  const insets = useSafeAreaInsets();
  const keyboardUp = useIosKeyboardVisible();
  const [tab, setTab] = useState<TabId>('members');

  const myRole: GuildRole = guild.myRole ?? 'MEMBER';
  // The tab bar overlays the bottom of the screen; the iOS keyboard hides it.
  const scrollBottomPad = keyboardUp ? KEYBOARD_GAP : SCROLL_BOTTOM_PAD + insets.bottom;
  const chatBottomPad = keyboardUp ? KEYBOARD_GAP : TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + KEYBOARD_GAP;

  return (
    <View style={local.container}>
      <View style={local.top}>
        <GlassCard width={cardWidth} height={92} chamfer={12} variant="tr-bl">
          <View style={local.banner}>
            <TagChip tag={guild.tag} color={KS.alert} />
            <View style={local.bannerInfo}>
              <Text style={local.name} numberOfLines={1}>{guild.name}</Text>
              <Text style={[local.role, { color: ROLE_COLOR[myRole] }]}>{t(ROLE_KEY[myRole])}</Text>
            </View>
            <View style={local.bannerRight}>
              <Text style={local.count}>{guild.memberCount}/{guild.maxMembers}</Text>
              <Text style={[local.access, { color: guild.isOpen ? KS.live : KS.alert }]}>
                {guild.isOpen ? t('open') : t('inviteOnly')}
              </Text>
            </View>
          </View>
        </GlassCard>
        {!!guild.description && (
          <Text style={local.description} numberOfLines={3}>{guild.description}</Text>
        )}

        <View style={local.tabs} accessibilityRole="tablist">
          {TABS.map((id) => {
            const selected = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                accessibilityRole="tab"
                accessibilityLabel={t(TAB_LABEL[id])}
                accessibilityState={{ selected }}
                style={[local.tab, selected && local.tabActive]}
              >
                <Text style={[local.tabText, selected && local.tabTextActive]}>{t(TAB_LABEL[id])}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {tab === 'members' && (
        <MembersTab
          guild={guild}
          myRole={myRole}
          myUserId={myUserId}
          cardWidth={cardWidth}
          bottomPad={scrollBottomPad}
        />
      )}
      {tab === 'chat' && <ChatTab myUserId={myUserId} bottomPad={chatBottomPad} />}
      {tab === 'manage' && <ManageTab guild={guild} myRole={myRole} bottomPad={scrollBottomPad} />}
    </View>
  );
};

const local = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: PAD, paddingTop: 12, gap: 10 },
  banner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  bannerInfo: { flex: 1 },
  bannerRight: { alignItems: 'flex-end', gap: 2 },
  name: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.06,
  },
  role: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.22,
    marginTop: 2,
  },
  count: { color: KS.inkMute, fontFamily: TYPO.monoBold, fontSize: SIZES.monoLg },
  access: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.18 },
  description: { color: KS.inkMute, fontFamily: TYPO.ui, fontSize: SIZES.body },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: KS.hairSoft,
  },
  tabActive: { backgroundColor: KS.primary, borderColor: KS.primary },
  tabText: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  tabTextActive: { color: KS.onPrimary },
});

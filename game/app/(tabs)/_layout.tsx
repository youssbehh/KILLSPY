import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '@/src/theme/colors';
import { TYPO } from '@/src/theme/typography';
import { useInbox } from '@/src/hooks/useMessages';

// ── SVG icon paths ─────────────────────────────────────────────────────────────
const NAV_ICONS = {
  home:    'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  hq:      'M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7z',
  shop:    'M4 7h16l-1.5 11a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8zM9 7V5a3 3 0 0 1 6 0v2',
  friends: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  profile: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.7-8 5v2h16v-2c0-3.3-4.7-5-8-5z',
};

type IconKey = keyof typeof NAV_ICONS;

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: Array<{
  id: string;
  label: string;
  route: string;
  icon: IconKey;
  badge?: 'shop' | 'friends';
}> = [
  { id: 'home',    label: 'HOME',     route: '/(tabs)/gamechoice', icon: 'home'    },
  { id: 'hq',      label: 'QG',       route: '/(tabs)/hq',         icon: 'hq'      },
  { id: 'shop',    label: 'SHOP',     route: '/(tabs)/shop',       icon: 'shop',    badge: 'shop' },
  { id: 'friends', label: 'CONTACTS', route: '/(tabs)/friends',    icon: 'friends', badge: 'friends' },
  { id: 'profile', label: 'AGENT',    route: '/(tabs)/options',    icon: 'profile' },
];

function activeItemId(pathname: string): string {
  if (pathname.includes('gamechoice')) return 'home';
  if (pathname.includes('/hq'))        return 'hq';
  if (pathname.includes('shop'))       return 'shop';
  if (pathname.includes('friends'))    return 'friends';
  if (pathname.includes('options') || pathname.includes('inventory')) return 'profile';
  return 'home';
}

// ── Friends unread hook (for badge) ──────────────────────────────────────────
function useFriendsUnread(): number {
  const { data: inbox } = useInbox();
  return (inbox ?? []).reduce((acc, s) => acc + s.unreadCount, 0);
}

// ── Custom tab bar ─────────────────────────────────────────────────────────────
function KSBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = activeItemId(pathname);
  const bottomPad = Math.max(insets.bottom, 8);
  const friendsUnread = useFriendsUnread();

  return (
    <View style={[styles.wrapper, { height: 64 + bottomPad }]}>
      {/* Blur layer */}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Items row */}
      <View style={[styles.row, { paddingBottom: bottomPad }]}>
        {NAV_ITEMS.map((item) => {
          const on = active === item.id;

          // Compute badge count
          let badgeCount: number | null = null;
          if (item.badge === 'friends' && friendsUnread > 0) {
            badgeCount = friendsUnread;
          }

          return (
            <Pressable
              key={item.id}
              onPress={() => router.replace(item.route as any)}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              {/* Active indicator bar */}
              {on && <View style={styles.activeBar} />}

              {/* Icon + badge */}
              <View style={styles.iconWrap}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d={NAV_ICONS[item.icon]}
                    stroke={on ? KS.primary : KS.inkDim}
                    strokeWidth={on ? 2.2 : 1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={on ? KS.primary : 'none'}
                    fillOpacity={on ? 0.18 : 0}
                  />
                </Svg>

                {badgeCount != null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[styles.label, { color: on ? KS.primary : KS.inkDim }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 2,
    backgroundColor: KS.primary,
    borderRadius: 1,
    shadowColor: KS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrap: {
    position: 'relative',
    width: 22,
    height: 22,
  },
  label: {
    fontFamily: TYPO.display,
    fontSize: 9,
    letterSpacing: 9 * 0.22,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: KS.live,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    shadowColor: KS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeText: {
    fontFamily: TYPO.monoBold,
    fontSize: 8,
    color: '#000',
    fontWeight: '700',
  },
});

// ── Tab layout ─────────────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <KSBottomNav />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="gamechoice" />
      <Tabs.Screen name="hq" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="options" />
      <Tabs.Screen name="inventory" options={{ href: null }} />
    </Tabs>
  );
}

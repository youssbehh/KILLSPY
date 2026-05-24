import React from 'react';
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { Hexagon } from './Hexagon';
import { ThemedText } from './ThemedText';
import { radius, spacing, fontSize, fontWeight } from '../theme/tokens';

export interface BottomNavTab {
  id: string;
  label: string;
  emoji: string;
  onPress: () => void;
  badge?: string | number;
}

interface CustomBottomNavProps {
  tabs: BottomNavTab[];
  centerTabIndex?: number;   // tab that becomes the "hero" hex in the middle
  activeId: string;
}

/**
 * Bottom navigation bar with a prominent centre hex tab — replaces the default
 * expo-router tab bar for the in-game flow.
 *
 * On web / large screens it switches to a top horizontal layout (just keeps
 * the same elements without the centre raise effect).
 */
export const CustomBottomNav: React.FC<CustomBottomNavProps> = ({
  tabs,
  centerTabIndex = Math.floor(tabs.length / 2),
  activeId,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width >= 720;

  return (
    <View
      style={[
        isWeb ? styles.webBar : styles.mobileBar,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      {tabs.map((tab, idx) => {
        const isCenter = !isWeb && idx === centerTabIndex;
        const active = tab.id === activeId;
        return (
          <Pressable key={tab.id} onPress={tab.onPress} style={styles.tab}>
            {isCenter ? (
              <Hexagon
                size={64}
                gradient={[theme.colors.primary, theme.colors.primaryDark]}
                borderColor={theme.colors.primary}
                glow={active}
                glowColor={theme.colors.primary}
                style={{ marginTop: -28 }}
              >
                <ThemedText style={{ fontSize: 26 }}>{tab.emoji}</ThemedText>
              </Hexagon>
            ) : (
              <View style={styles.iconWrapper}>
                <ThemedText
                  style={{ fontSize: active ? 26 : 22, opacity: active ? 1 : 0.6 }}
                >
                  {tab.emoji}
                </ThemedText>
                {tab.badge !== undefined && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}>
                    <ThemedText color="#ffffff" style={styles.badgeText}>{String(tab.badge)}</ThemedText>
                  </View>
                )}
              </View>
            )}
            <ThemedText
              style={[
                styles.label,
                {
                  color: active ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: (active ? fontWeight.bold : fontWeight.semibold) as '700' | '600',
                },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  mobileBar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  webBar: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  tab: { alignItems: 'center', flex: 1, paddingTop: 4 },
  iconWrapper: { position: 'relative' },
  badge: {
    position: 'absolute', top: -6, right: -10,
    minWidth: 16, height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: fontWeight.bold as '700' },
  label: { fontSize: fontSize.xs, marginTop: 2 },
});

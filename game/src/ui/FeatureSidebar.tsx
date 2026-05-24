import React from 'react';
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { radius, spacing, stickerRelief, fontSize, fontWeight } from '../theme/tokens';
import { ThemedText } from './ThemedText';

export interface FeatureButton {
  id: string;
  label: string;
  emoji: string;          // placeholder until 3D icons are sourced
  badge?: string | number; // optional red badge (e.g. "NEW", 2)
  onPress: () => void;
  color?: string;         // override background tint
}

interface FeatureSidebarProps {
  /** Side A → shown on the left (mobile floating) / inside web sidebar */
  left?: FeatureButton[];
  /** Side B → shown on the right (mobile floating) / collapsed on web */
  right?: FeatureButton[];
}

/**
 * Cross-platform feature sidebar.
 *
 * Mobile (portrait, narrow):
 *   - left buttons float on the left edge
 *   - right buttons float on the right edge
 *
 * Web / large screens:
 *   - everything is collected into a fixed sidebar on the left
 *   - the right buttons appear under the left ones with a separator
 *
 * This component stays purely decorative — handlers and counters come
 * from the parent screen.
 */
export const FeatureSidebar: React.FC<FeatureSidebarProps> = ({ left = [], right = [] }) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 720 && Platform.OS === 'web';
  const theme = useTheme();

  if (isWide) {
    return (
      <View style={[styles.webSidebar, { backgroundColor: theme.colors.surfaceOverlay, borderColor: theme.colors.border }]}>
        {left.map((b) => (
          <FeatureBubble key={b.id} {...b} expanded />
        ))}
        {right.length > 0 && (
          <View style={[styles.webDivider, { backgroundColor: theme.colors.border }]} />
        )}
        {right.map((b) => (
          <FeatureBubble key={b.id} {...b} expanded />
        ))}
      </View>
    );
  }

  return (
    <>
      <View style={[styles.mobileColumn, styles.mobileLeft]} pointerEvents="box-none">
        {left.map((b) => (
          <FeatureBubble key={b.id} {...b} />
        ))}
      </View>
      <View style={[styles.mobileColumn, styles.mobileRight]} pointerEvents="box-none">
        {right.map((b) => (
          <FeatureBubble key={b.id} {...b} />
        ))}
      </View>
    </>
  );
};

const FeatureBubble: React.FC<FeatureButton & { expanded?: boolean }> = ({
  label, emoji, badge, onPress, color, expanded,
}) => {
  const theme = useTheme();
  const bg = color ?? theme.colors.surfaceAlt;

  return (
    <Pressable onPress={onPress} style={styles.bubbleWrapper}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: stickerRelief.sm, bottom: -stickerRelief.sm, backgroundColor: theme.colors.borderStrong, borderRadius: radius.lg, opacity: 0.6 }} />
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: theme.colors.borderStrong }, expanded && styles.bubbleExpanded]}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        {expanded && (
          <ThemedText style={styles.expandedLabel} color={theme.colors.text}>
            {label}
          </ThemedText>
        )}
        {!expanded && (
          <ThemedText style={styles.label} color={theme.colors.textMuted}>
            {label}
          </ThemedText>
        )}
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}>
            <ThemedText color="#ffffff" style={styles.badgeText}>{String(badge)}</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  mobileColumn: {
    position: 'absolute',
    top: 100,
    gap: spacing.sm,
    zIndex: 5,
  },
  mobileLeft: { left: spacing.sm },
  mobileRight: { right: spacing.sm },
  webSidebar: {
    position: 'absolute',
    left: 0,
    top: 80,
    bottom: 0,
    width: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRightWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  webDivider: { height: 1, width: '70%', marginVertical: spacing.sm },
  bubbleWrapper: { position: 'relative' },
  bubble: {
    width: 64, minHeight: 64,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  bubbleExpanded: { minHeight: 80 },
  emoji: { fontSize: 22 },
  label: { fontSize: 9, fontWeight: fontWeight.semibold as '600', marginTop: 2 },
  expandedLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold as '700', marginTop: 2, textAlign: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: fontWeight.bold as '700' },
});

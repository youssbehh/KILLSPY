import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../stores/themeStore';
import { spacing, fontSize, fontWeight } from '../theme/tokens';
import { Hexagon } from './Hexagon';
import { ResourceChip } from './ResourceChip';
import { ThemedText } from './ThemedText';
import { useAuthStore } from '../stores/authStore';
import { useMyStats } from '../hooks/useGames';
import { mmrToRank } from '../game/ranking';

interface HUDStripProps {
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

/**
 * Top strip shown across the main screens.
 * Layout: [avatar hex + level badge] [money chip] [XP bar + level] [settings cog]
 * Resources are minimal (money + XP only — no energy/lives).
 */
export const HUDStrip: React.FC<HUDStripProps> = ({ showSettings = true, onSettingsPress }) => {
  const router = useRouter();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data } = useMyStats();

  const money = user?.money ?? 0;
  const mmr = data?.user.mmr ?? user?.mmr ?? 0;
  const rank = mmrToRank(mmr);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.surfaceOverlay, borderColor: theme.colors.border }]}>
      <Pressable onPress={() => router.push('/Profil')} hitSlop={8}>
        <Hexagon
          size={48}
          gradient={[rank.color, theme.colors.surfaceAlt]}
          borderColor={rank.color}
          borderWidth={2}
          glow
          glowColor={rank.color}
        >
          <ThemedText style={{ fontSize: fontSize.xs, fontWeight: fontWeight.bold as '700' }}>
            {user?.username?.slice(0, 2).toUpperCase() ?? '??'}
          </ThemedText>
        </Hexagon>
      </Pressable>

      <View style={styles.center}>
        <ResourceChip
          icon={<MoneyIcon color={theme.colors.money} />}
          value={formatNumber(money)}
          color={theme.colors.surface}
          edgeColor={theme.colors.borderStrong}
        />
      </View>

      <View style={styles.mmr}>
        <ThemedText style={styles.mmrLabel} color={theme.colors.textMuted}>
          {rank.label.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.mmrValue} color={rank.color}>
          {mmr} MMR
        </ThemedText>
      </View>

      {showSettings && (
        <Pressable
          onPress={onSettingsPress ?? (() => router.push('/(tabs)/options'))}
          style={[styles.cog, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          hitSlop={8}
        >
          <ThemedText style={{ fontSize: 20 }}>⚙</ThemedText>
        </Pressable>
      )}
    </View>
  );
};

/** Quick inline SVG-less money icon (yellow coin). Replace by 3D asset later. */
const MoneyIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, borderWidth: 1.5, borderColor: '#8a6500' }} />
);

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  center: { flex: 1, alignItems: 'flex-start' },
  mmr: { alignItems: 'flex-end', marginRight: spacing.sm },
  mmrLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as '600', letterSpacing: 1 },
  mmrValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as '700' },
  cog: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});

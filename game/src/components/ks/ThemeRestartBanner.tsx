import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/src/stores/themeStore';
import { isInMatch, useGameStore } from '@/src/stores/gameStore';
import { themes } from '@/src/theme/themes';
import { useLocalT } from '@/src/i18n/local';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const STRINGS = {
  fr: {
    title: 'THÈME « {name} » ÉQUIPÉ',
    body: "Redémarre l'application pour l'appliquer partout.",
    restart: 'REDÉMARRER',
    later: 'Plus tard',
  },
  en: {
    title: '“{name}” THEME EQUIPPED',
    body: 'Restart the app to apply it everywhere.',
    restart: 'RESTART',
    later: 'Later',
  },
} as const;

export const restartApp = async () => {
  if (Platform.OS === 'web') {
    globalThis.location?.reload();
    return;
  }
  // Loaded on demand: the app is about to restart anyway.
  const { reloadAppAsync } = await import('expo');
  await reloadAppAsync('theme changed');
};

/** Offers to restart once a newly equipped theme is waiting. Never shown during a match. */
export const ThemeRestartBanner = () => {
  const t = useLocalT(STRINGS);
  const insets = useSafeAreaInsets();
  const pending = useThemeStore((s) => s.restartPending);
  const equippedId = useThemeStore((s) => s.equippedId);
  const inMatch = useGameStore((s) => isInMatch(s.matchStatus));
  const [dismissed, setDismissed] = React.useState<string | null>(null);

  if (!pending || inMatch || dismissed === equippedId) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <View style={styles.box} accessibilityRole="alert">
        <View style={styles.text}>
          <Text style={styles.title}>{t('title', { name: themes[equippedId].fallbackLabel.toUpperCase() })}</Text>
          <Text style={styles.body}>{t('body')}</Text>
        </View>
        <Pressable
          onPress={() => setDismissed(equippedId)}
          accessibilityRole="button"
          style={styles.later}
          hitSlop={8}
        >
          <Text style={styles.laterText}>{t('later')}</Text>
        </Pressable>
        <Pressable
          onPress={() => void restartApp()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.restart, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.restartText}>{t('restart')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  box: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.primary,
  },
  text: { flex: 1, gap: 2 },
  title: { color: KS.primary, fontFamily: TYPO.monoBold, fontSize: SIZES.monoMd, letterSpacing: 1 },
  body: { color: KS.inkMute, fontFamily: TYPO.ui, fontSize: SIZES.bodySm },
  later: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  laterText: { color: KS.inkDim, fontFamily: TYPO.ui, fontSize: SIZES.bodySm },
  restart: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: KS.primary,
  },
  restartText: { color: KS.bg, fontFamily: TYPO.monoBold, fontSize: SIZES.monoMd },
});

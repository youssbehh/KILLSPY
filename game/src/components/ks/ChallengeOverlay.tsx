import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useChallengeStore } from '../../stores/challengeStore';
import { useLocalT } from '../../i18n/local';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

const STRINGS = {
  fr: {
    eyebrow: 'DÉFI REÇU',
    body: '{name} te défie en duel amical',
    accept: 'ACCEPTER',
    decline: 'REFUSER',
    secondsLeft: '{n} s',
  },
  en: {
    eyebrow: 'CHALLENGE RECEIVED',
    body: '{name} challenges you to a friendly duel',
    accept: 'ACCEPT',
    decline: 'DECLINE',
    secondsLeft: '{n}s',
  },
} as const;

/**
 * Banner shown on top of any screen when a friend sends a duel challenge.
 * Accepting starts a friendly match: the root layout then opens the duel screen.
 */
export const ChallengeOverlay: React.FC = () => {
  const t = useLocalT(STRINGS);
  const insets = useSafeAreaInsets();
  const incoming = useChallengeStore((s) => s.incoming);
  const accept = useChallengeStore((s) => s.acceptIncoming);
  const decline = useChallengeStore((s) => s.declineIncoming);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!incoming) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((incoming.expiresAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [incoming]);

  if (!incoming) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]} accessibilityRole="alert">
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.eyebrow}>// {t('eyebrow')}</Text>
          <Text style={styles.timer}>{t('secondsLeft', { n: secondsLeft })}</Text>
        </View>
        <Text style={styles.body}>{t('body', { name: incoming.from.username.toUpperCase() })}</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={decline}
            accessibilityRole="button"
            accessibilityLabel={t('decline')}
            style={[styles.button, styles.decline]}
          >
            <Text style={[styles.buttonText, { color: KS.inkMute }]}>{t('decline')}</Text>
          </Pressable>
          <Pressable
            onPress={accept}
            accessibilityRole="button"
            accessibilityLabel={t('accept')}
            style={[styles.button, styles.accept]}
          >
            <Text style={[styles.buttonText, { color: KS.ink }]}>{t('accept')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: KS.surfaceHi,
    borderWidth: 1,
    borderColor: KS.alert,
    borderRadius: 6,
    padding: 14,
    gap: 8,
    shadowColor: KS.alert,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    color: KS.alert,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  timer: { color: KS.inkDim, fontFamily: TYPO.monoBold, fontSize: SIZES.monoMd },
  body: { color: KS.ink, fontFamily: TYPO.uiBold, fontSize: SIZES.bodyLg },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  decline: { borderWidth: 1, borderColor: KS.hairSoft },
  accept: { backgroundColor: KS.primary },
  buttonText: { fontFamily: TYPO.display, fontSize: SIZES.labelLg, letterSpacing: SIZES.labelLg * 0.06 },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocalT } from '@/src/i18n/local';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const STRINGS = {
  fr: {
    title: 'ADRESSE E-MAIL À VÉRIFIER',
    body: 'Vérifie ton adresse pour débloquer le classé, la boutique, les messages et les guildes.',
    action: 'VÉRIFIER',
    a11y: 'Ouvrir les paramètres du compte pour vérifier mon adresse e-mail',
  },
  en: {
    title: 'VERIFY YOUR E-MAIL',
    body: 'Verify your address to unlock ranked, the shop, messages and guilds.',
    action: 'VERIFY',
    a11y: 'Open account settings to verify my e-mail address',
  },
} as const;

/** True while the server keeps ranked, shop, messages and guilds locked for this account. */
export const useNeedsVerification = () => useAuthStore((s) => s.user?.verificationRequired === true);

/** Shown above a locked feature; opens the account settings where the code is sent and typed. */
export const VerifyEmailBanner = ({ compact = false }: { compact?: boolean }) => {
  const t = useLocalT(STRINGS);
  const router = useRouter();
  const needed = useNeedsVerification();
  if (!needed) return null;

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      accessibilityRole="button"
      accessibilityLabel={t('a11y')}
      style={({ pressed }) => [styles.box, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{t('title')}</Text>
        {!compact && <Text style={styles.body}>{t('body')}</Text>}
      </View>
      <Text style={styles.action}>{t('action')} ›</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: KS.alert,
    backgroundColor: 'rgba(255,193,7,0.08)',
  },
  compact: { paddingVertical: 6 },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  title: {
    color: KS.alert,
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoMd,
    letterSpacing: SIZES.monoMd * 0.12,
  },
  body: { color: KS.inkMute, fontFamily: TYPO.ui, fontSize: SIZES.bodySm },
  action: { color: KS.alert, fontFamily: TYPO.monoBold, fontSize: SIZES.monoMd },
});

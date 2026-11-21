import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '@/src/i18n';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

export default function NotFoundScreen() {
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.code}>// 404</Text>
        <Text style={styles.title}>{t('notFoundTitle').toUpperCase()}</Text>
        <Link href="/" style={styles.link}>
          {t('notFoundBack')}
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: KS.bg,
  },
  code: { color: KS.primary, fontFamily: TYPO.mono, fontSize: SIZES.monoMd },
  title: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleMd, textAlign: 'center' },
  link: {
    color: KS.primary,
    fontFamily: TYPO.uiBold,
    fontSize: SIZES.bodyLg,
    paddingVertical: 16,
  },
});

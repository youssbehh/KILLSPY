import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { Currency, GlassCard, TopoBg } from '../components/ks';
import { MyGuild } from '../api/guilds';
import { useMyGuild } from '../hooks/useGuilds';
import { useAuthStore } from '../stores/authStore';
import { GuildView } from './hq/GuildView';
import { VerifyEmailBanner } from '../components/ks/VerifyEmailBanner';
import { NoGuildView } from './hq/NoGuildView';
import { useHqT } from './hq/strings';
import { ErrorState, KsButton, LoadingState, PAD } from './hq/ui';

const GUEST_CARD_HEIGHT = 200;

export const HQScreen: React.FC = () => {
  const t = useHqT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = width - PAD * 2;

  const money = useAuthStore((s) => s.user?.money ?? 0);
  const myUserId = useAuthStore((s) => s.user?.id);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  const myGuildQuery = useMyGuild();
  const guild: MyGuild | null = myGuildQuery.data ?? null;

  const renderBody = () => {
    if (isGuest) {
      return (
        <View style={styles.padded}>
          <GlassCard width={cardWidth} height={GUEST_CARD_HEIGHT} chamfer={12} variant="tr-bl">
            <View style={styles.guest}>
              <Text style={styles.guestTitle}>{t('guestTitle')}</Text>
              <Text style={styles.guestBody}>{t('guestBody')}</Text>
              <KsButton label={t('guestCta')} tone="alert" onPress={() => router.push('/settings')} />
            </View>
          </GlassCard>
        </View>
      );
    }
    if (guild) return <GuildView guild={guild} myUserId={myUserId} cardWidth={cardWidth} />;
    if (myGuildQuery.isLoading) return <LoadingState />;
    if (myGuildQuery.isError) {
      return <ErrorState text={t('myGuildError')} onRetry={() => myGuildQuery.refetch()} />;
    }
    return <NoGuildView cardWidth={cardWidth} />;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TopoBg />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.eyebrow}>{t('eyebrow')}</Text>
            <Text style={styles.title} accessibilityRole="header">{t('title')}</Text>
          </View>
          <Currency kind="coin" value={money} />
        </View>
        {!isGuest && (
          <View style={styles.banner}>
            <VerifyEmailBanner />
          </View>
        )}
        <View style={styles.body}>{renderBody()}</View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAD,
  },
  eyebrow: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.32,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: SIZES.titleMd * 0.1,
    marginTop: 2,
  },
  body: { flex: 1 },
  padded: { paddingHorizontal: PAD, paddingTop: 12 },
  banner: { paddingHorizontal: PAD, paddingTop: 8 },
  guest: { flex: 1, padding: 16, gap: 10, justifyContent: 'center' },
  guestTitle: {
    color: KS.alert,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.06,
  },
  guestBody: { color: KS.inkMute, fontFamily: TYPO.ui, fontSize: SIZES.body },
});

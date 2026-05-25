import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { TopoBg, ChamferContainer } from '@/src/components/ks';
import { useAuthStore } from '@/src/stores/authStore';
import { useLogoutMutation } from '@/src/hooks/useAuthFlow';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/store/languageStore';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import AudioContainer from './sousoptions/optaudio';
import CompteContainer from './sousoptions/optcompte';
import SecuriteContainer from './sousoptions/optsecurite';
import DiversContainer from './sousoptions/optdivers';
import SupportContainer from './sousoptions/optsupport';
import ProposContainer from './sousoptions/optpropos';
import { appVersion } from '../config';

export default function SettingsScreen() {
  const router = useRouter();
  const { langIndex } = useLanguageStore();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const logoutMutation = useLogoutMutation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = async () => {
    setModalVisible(false);
    await logoutMutation.mutateAsync();
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TopoBg />
        <LoadingOverlay isLoading={logoutMutation.isPending} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>// AGENT CONFIG</Text>
            <Text style={styles.title}>SETTINGS</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <CompteContainer />
          <AudioContainer />
          <SecuriteContainer />
          <SupportContainer />
          <DiversContainer />
          <ProposContainer />

          {/* Logout */}
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
          >
            <ChamferContainer
              width={undefined as any}
              height={52}
              chamfer={8}
              variant="tr-bl"
              fill={KS.danger + '18'}
              stroke={KS.danger}
            >
              <View style={styles.logoutInner}>
                <Text style={styles.logoutText}>
                  {!isGuest ? motTraduit(langIndex, 51) : motTraduit(langIndex, 39)}
                </Text>
              </View>
            </ChamferContainer>
          </Pressable>

          <Text style={styles.footer}>MIMIR STUDIO · v{appVersion} · BUILD 0524</Text>
        </ScrollView>

        <AlertModal
          visible={modalVisible}
          text1={!isGuest ? motTraduit(langIndex, 64) : motTraduit(langIndex, 45)}
          button1={!isGuest ? motTraduit(langIndex, 51) : motTraduit(langIndex, 39)}
          onPress1={handleLogout}
          button2={motTraduit(langIndex, 35)}
          onPress2={() => setModalVisible(false)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hairSoft,
  },
  backArrow: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: 24,
    lineHeight: 28,
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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 48, gap: 12 },

  logoutBtn: { marginTop: 8 },
  logoutInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoutText: {
    color: KS.danger,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.1,
  },

  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: KS.inkFaint,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.22,
  },
});

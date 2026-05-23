import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../../config';
import { useLanguageStore } from '../../store/languageStore';
import { Button } from '@rneui/themed';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';

import AudioContainer from '../sousoptions/optaudio';
import CompteContainer from '../sousoptions/optcompte';
import SecuriteContainer from '../sousoptions/optsecurite';
import DiversContainer from '../sousoptions/optdivers';
import SupportContainer from '../sousoptions/optsupport';
import ProposContainer from '../sousoptions/optpropos';

import { useAuthStore } from '@/src/stores/authStore';
import { useLogoutMutation } from '@/src/hooks/useAuthFlow';

export default function OptionsScreen() {
  const { langIndex } = useLanguageStore();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    setModalVisible(false);
    await logoutMutation.mutateAsync();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay isLoading={logoutMutation.isPending} />
      <Text style={styles.titleh1}>{motTraduit(langIndex, 7)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView style={{ width: '90%' }}>
        <CompteContainer />
        <AudioContainer />
        <SecuriteContainer />
        <SupportContainer />
        <DiversContainer />
        <ProposContainer />
        <Button onPress={() => setModalVisible(true)}>
          {!isGuest ? motTraduit(langIndex, 51) : motTraduit(langIndex, 39)}
        </Button>

        <AlertModal
          visible={modalVisible}
          text1={!isGuest ? motTraduit(langIndex, 64) : motTraduit(langIndex, 45)}
          button1={!isGuest ? motTraduit(langIndex, 51) : motTraduit(langIndex, 39)}
          onPress1={handleLogout}
          button2={motTraduit(langIndex, 35)}
          onPress2={() => setModalVisible(false)}
        />
      </ScrollView>

      <Text style={styles.footer}>MIMIR Studio 2024 / V. {appVersion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleh1: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  separator: { marginVertical: 30, height: 1, width: '80%' },
  footer: { marginTop: 20, fontSize: 16, color: '#888', marginBottom: 5 },
});

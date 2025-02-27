import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../../config';
import { useLanguageStore } from '../../store/languageStore';
import { Button } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';

import AudioContainer from '../sousoptions/optaudio';
import CompteContainer from '../sousoptions/optcompte';
import SecuriteContainer from '../sousoptions/optsecurite';
import DiversContainer from '../sousoptions/optdivers';
import SupportContainer from '../sousoptions/optsupport';
import ProposContainer from '../sousoptions/optpropos';



export default function OptionsScreen() {
  const { langIndex } = useLanguageStore();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const confirmLogoutMessage = async () => {
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchGuest = async () => {
        const isGuest = await AsyncStorage.getItem('isGuest');
        setIsGuest(isGuest === 'true');
    };
    fetchGuest();
}, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const id = await AsyncStorage.getItem('userId');
      console.log("Token récupéré :", token);
  
      if (!token) {
        console.warn("Aucun token trouvé, l'utilisateur est peut-être déjà déconnecté.");
        await AsyncStorage.clear();
        router.replace('/');
        return;
      }
  
      const response = await fetch(`${apiUrl}/auth/logout/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
        }),
      });

      console.log("Réponse serveur :", response.status, await response.text());
  
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      setIsLoading(false);
      console.log("Déconnexion réussie");
      await AsyncStorage.clear();
      router.replace('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay isLoading={isLoading} />
      <Text style={styles.titleh1}>{motTraduit(langIndex, 7)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView style={{width:'90%'}}>
        <CompteContainer/>
        <AudioContainer/>
        <SecuriteContainer/>
        <SupportContainer/>
        <DiversContainer/>
        <ProposContainer/>
        <Button onPress={confirmLogoutMessage}>{!isGuest ? motTraduit(langIndex, 51) : motTraduit(langIndex, 39)}</Button>

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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleh1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  footer: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
});
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../../config';
import { useLanguageStore } from '../../store/languageStore';
import { Button } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
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
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const confirmLogoutMessage = () => __awaiter(this, void 0, void 0, function* () {
        setModalVisible(true);
    });
    const handleLogout = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield AsyncStorage.getItem('userToken');
            const id = yield AsyncStorage.getItem('userId');
            console.log("Token récupéré :", token);
            if (!token) {
                console.warn("Aucun token trouvé, l'utilisateur est peut-être déjà déconnecté.");
                yield AsyncStorage.clear();
                router.replace('/');
                return;
            }
            const response = yield fetch(`${apiUrl}/auth/logout/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                }),
            });
            console.log("Réponse serveur :", response.status, yield response.text());
            if (!response.ok) {
                throw new Error(`Erreur serveur: ${response.status}`);
            }
            console.log("Déconnexion réussie");
            yield AsyncStorage.clear();
            router.replace('/');
        }
        catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    });
    return (<View style={styles.container}>
      <Text style={styles.titleh1}>{motTraduit(langIndex, 7)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)"/>
      <ScrollView style={{ width: '90%' }}>
        <CompteContainer />
        <AudioContainer />
        <SecuriteContainer />
        <SupportContainer />
        <DiversContainer />
        <ProposContainer />
        <Button onPress={confirmLogoutMessage}>{motTraduit(langIndex, 51)}</Button>

        <AlertModal visible={modalVisible} text1={motTraduit(langIndex, 64)} button1={motTraduit(langIndex, 51)} onPress1={handleLogout} button2={motTraduit(langIndex, 35)} onPress2={() => setModalVisible(false)}/>
      </ScrollView>
      
      <Text style={styles.footer}>MIMIR Studio 2024 / V. {appVersion}</Text>
    </View>);
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

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry, Alert } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { useRouter } from 'expo-router';
import { Button } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
const element = () => (<View>
    <FontAwesomeWrapper icon={faCaretDown}/>
    <FontAwesomeWrapper icon={faCaretUp}/>
  </View>);
const ProposParam = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };
    return (<View style={styles.container}>
      <TouchableOpacity onPress={toggleAccordion} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <FontAwesomeWrapper icon={isOpen ? faCaretUp : faCaretDown}/>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>);
};
const ProposContainer = () => {
    const { langIndex } = useLanguageStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const router = useRouter();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const handleDeleteAccount = () => {
        setModalVisible(true);
        setCountdown(5);
        setIsCountdownActive(true);
    };
    useEffect(() => {
        let timer;
        if (isCountdownActive && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        else if (countdown === 0) {
            setIsCountdownActive(false);
        }
        return () => clearInterval(timer);
    }, [isCountdownActive, countdown]);
    const confirmDeleteAccount = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = yield AsyncStorage.getItem('userToken');
            const id = yield AsyncStorage.getItem('userId');
            const response = yield fetch(`${apiUrl}/users/deleteUser/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log('Response:', response);
            if (!response.ok) {
                const errorMessage = yield response.text();
                throw new Error(`Erreur lors de la suppression du compte : ${errorMessage}`);
            }
            // Si la suppression est réussie, vous pouvez rediriger l'utilisateur ou afficher un message
            yield AsyncStorage.clear();
            router.replace('/');
            Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès.");
        }
        catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Une erreur est survenue lors de la suppression de votre compte.");
        }
        finally {
            setModalVisible(false); // Ferme le modal après la suppression
        }
    });
    return (<View>
      <ProposParam title={motTraduit(langIndex, 29)}>
        <Text style={styles.title}>Informations sur la protection des données</Text>
        <Text style={styles.content}>
          Nous nous engageons à protéger vos données personnelles. Voici les informations que nous collectons et conservons :
        </Text>
        <Text style={styles.content}>
          1. **Nom d'utilisateur** : Utilisé pour identifier votre compte.
        </Text>
        <Text style={styles.content}>
          2. **Adresse e-mail** : Utilisée pour la communication et la récupération de compte.
        </Text>
        <Text style={styles.content}>
          3. **Historique de jeu** : Conserve vos performances et vos statistiques de jeu.
        </Text>
        <Text style={styles.content}>
          4. **Données de connexion** : Enregistrées pour des raisons de sécurité et d'analyse.
        </Text>
        <Text style={styles.content}>
          5. **Préférences utilisateur** : Pour personnaliser votre expérience sur notre plateforme.
        </Text>
        <Text style={styles.content}>
          Nous ne partageons pas vos données personnelles avec des tiers sans votre consentement, sauf si la loi l'exige.
        </Text>
        <Text style={styles.content}>
          Vous avez le droit de demander l'accès à vos données, de les corriger ou de les supprimer à tout moment.
        </Text>
        <Button title={motTraduit(langIndex, 68)} onPress={handleDeleteAccount}/>

        <AlertModal visible={modalVisible} text1={motTraduit(langIndex, 67)} text2={isCountdownActive ? `Attendez ${countdown} secondes...` : ''} button1={motTraduit(langIndex, 65)} onPress1={isCountdownActive ? () => { } : confirmDeleteAccount} button1Style={{ backgroundColor: isCountdownActive ? 'gray' : 'red' }} disabled1={isCountdownActive} button2={motTraduit(langIndex, 66)} onPress2={() => setModalVisible(false)}/>
      </ProposParam>
    </View>);
};
const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#f1f1f1',
    },
    title: {
        fontSize: 16,
        marginBottom: 10,
    },
    content: {
        padding: 10,
        backgroundColor: '#fff',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    countdownText: {
        marginBottom: 15,
        fontSize: 16,
        color: 'orange',
    },
    confirmButton: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'gray',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
export default ProposContainer;
AppRegistry.registerComponent('KILLSPY', () => element);

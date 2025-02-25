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
import { StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../config';
import { useLanguageStore } from '../store/languageStore';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function LoginFormScreen() {
    const { langIndex } = useLanguageStore();
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoginForm, setIsLoginForm] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [passwordCrea, setPasswordCrea] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const changeForm = () => {
        setIsLoginForm(isLoginForm => !isLoginForm);
    };
    const handleSignup = () => __awaiter(this, void 0, void 0, function* () {
        if (!acceptTerms) {
            Alert.alert('Erreur', 'Veuillez accepter les conditions.');
            return;
        }
        if (passwordCrea !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
            return;
        }
        if (!username && !email) {
            Alert.alert('Erreur', 'Les champs sont vides.');
            return;
        }
        try {
            const response = yield fetch(`${apiUrl}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            });
            const data = yield response.json();
            if (!response.ok) {
                Alert.alert('Erreur', data.message || 'Erreur de connexion');
                return;
            }
            Alert.alert('Inscription réussie', 'Bienvenue agent veuillez vous connecter');
            changeForm();
        }
        catch (error) {
            Alert.alert('Erreur', 'Erreur de connexion au serveur');
        }
    });
    const handleLogin = () => __awaiter(this, void 0, void 0, function* () {
        if (!identifier) {
            Alert.alert('Erreur', 'Identifiant invalide');
            return;
        }
        try {
            const response = yield fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier,
                    password,
                }),
            });
            const data = yield response.json();
            if (!response.ok) {
                Alert.alert('Erreur', data.message || 'Erreur de connexion');
                return;
            }
            // Stockage du token et redirection
            // TODO: Stocker data.token de manière sécurisée
            yield AsyncStorage.setItem('userToken', data.token);
            console.log(data.token);
            yield AsyncStorage.setItem('userId', JSON.stringify(data.user.id));
            yield AsyncStorage.setItem('username', data.user.username);
            yield AsyncStorage.setItem('isGuest', data.user.guest);
            if (rememberMe) {
                yield AsyncStorage.setItem('User', identifier);
                yield AsyncStorage.setItem('password', data.password);
            }
            router.replace('/(tabs)/gamechoice');
        }
        catch (error) {
            Alert.alert('Erreur', 'Erreur de connexion au serveur');
        }
    });
    const handleGuest = () => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`${apiUrl}`);
            const response = yield fetch(`${apiUrl}/auth/guest`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = yield response.json();
            if (!response.ok) {
                Alert.alert('Erreur', data.message || 'Erreur de connexion');
                return;
            }
            console.log(data.user);
            // Stockage du token et redirection
            // TODO: Stocker data.token de manière sécurisée
            yield AsyncStorage.setItem('userToken', data.token);
            yield AsyncStorage.setItem('userId', JSON.stringify(data.user.id));
            yield AsyncStorage.setItem('username', data.user.username);
            yield AsyncStorage.setItem('isGuest', data.user.guest);
            router.replace('/(tabs)/gamechoice');
        }
        catch (error) {
            Alert.alert('Erreur', 'Erreur de connexion au serveur');
        }
    });
    return (<View style={styles.container}>
      <Text style={styles.title}>KILLSPY</Text>
      {isLoginForm ? (<>
      <TextInput style={styles.input} placeholder={motTraduit(langIndex, 52)} value={identifier} onChangeText={setIdentifier} autoCapitalize="none"/>

      <TextInput style={styles.input} placeholder={motTraduit(langIndex, 53)} value={password} onChangeText={setPassword} secureTextEntry/>

      <View style={styles.checkboxContainer}>
        <Checkbox value={rememberMe} onValueChange={setRememberMe} color={rememberMe ? '#007AFF' : undefined}/>
        <Text style={styles.checkboxLabel}>{motTraduit(langIndex, 57)}</Text>
      </View>
      </>) : (<>
      <TextInput style={styles.input} placeholder={motTraduit(langIndex, 58)} value={username} onChangeText={setUsername} autoCapitalize="none"/>

      <TextInput style={styles.input} placeholder={motTraduit(langIndex, 59)} value={email} onChangeText={setEmail} autoCapitalize="none"/>

      <TextInput style={styles.input} placeholder={motTraduit(langIndex, 53)} value={passwordCrea} onChangeText={setPasswordCrea} secureTextEntry/>

      <TextInput style={styles.input} placeholder={motTraduit(langIndex, 60)} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry/>

      <View style={styles.checkboxContainer}>
        <Checkbox value={acceptTerms} onValueChange={setAcceptTerms} color={acceptTerms ? '#007AFF' : undefined}/>
        <Text style={styles.checkboxLabel}>{motTraduit(langIndex, 61)}</Text>
      </View>
      </>)}
      <Pressable style={styles.button} onPress={isLoginForm ? handleLogin : handleSignup}>
        <Text style={styles.buttonText}>{isLoginForm ? motTraduit(langIndex, 56) : motTraduit(langIndex, 63)}</Text>
      </Pressable>

      <Pressable style={styles.buttonGuest} onPress={handleGuest}>
        <Text style={styles.buttonText}>{motTraduit(langIndex, 50)}</Text>
      </Pressable>

      <Pressable style={styles.textButton}>
        <Text style={styles.textButtonText}>{motTraduit(langIndex, 54)}</Text>
      </Pressable>

      <Pressable style={styles.textButton} onPress={changeForm}>
        <Text style={styles.textButtonText}>{isLoginForm ? motTraduit(langIndex, 55) : motTraduit(langIndex, 62)}</Text>
      </Pressable>
      <Text style={styles.footer}>MIMIR Studio 2024 / V. {appVersion}</Text>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: 'white',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonGuest: {
        width: '100%',
        height: 50,
        backgroundColor: '#ced4da',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    textButton: {
        padding: 10,
    },
    textButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 14,
    },
    footer: {
        marginTop: 20,
        fontSize: 16,
        color: '#888',
        marginBottom: 5,
    },
});

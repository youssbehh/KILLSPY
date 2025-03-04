import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../config';
import { useLanguageStore } from '../store/languageStore';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorModal from '@/components/ErrorModal';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [serverStatus, setServerStatus] = useState('');
  const [serverColor, setServerColor] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/ping/getPing`);
      if (response.ok) {
        setServerStatus('Serveur opérationnel');
        setServerColor('green'); // Vert si le serveur est opérationnel
      } else {
        setServerStatus('Serveur en attente');
        setServerColor('orange'); // Orange si en attente
      }
    } catch (error) {
      setServerStatus('Serveur hors ligne');
      setServerColor('red'); // Rouge si le serveur est hors ligne
    }
  };

  const showErrorModal = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  useEffect(() => {
    checkServerStatus(); // Vérifie le statut du serveur au chargement du composant
  }, []);

  const changeForm = () => {
      setIsLoginForm(isLoginForm => !isLoginForm);
  };

  const rgpdModal = async () => {
    setModalVisible(true);
    setCountdown(5);
    setIsCountdownActive(true);
  };

  const rgpdModalAccept = async () => {
    setModalVisible(false);
    setAcceptTerms(true);
  };

  const rgpdModalRefuse = async () => {
    setModalVisible(false);
    setAcceptTerms(false);
  };

  useEffect(() => {
    const fetchRememberMe = async () => {
        const rememberMe = await AsyncStorage.getItem('rememberMe');
        const identifier = await AsyncStorage.getItem('User');
        const password = await AsyncStorage.getItem('password');
        if (rememberMe === 'true') {
          setRememberMe(true)
          setIdentifier(identifier || '')
          setPassword(password || '')

        } else {
          setRememberMe(false)
        }
    };
    fetchRememberMe();
}, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountdownActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }
    return () => clearInterval(timer);
  }, [isCountdownActive, countdown]);

  const handleSignup = async () => {
    if (!acceptTerms) {
      showErrorModal('Erreur', 'Veuillez accepter les conditions.');
      return;
    }
    if (passwordCrea !== confirmPassword) {
      showErrorModal('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (!username && !email) {
      showErrorModal('Erreur', 'Les champs sont vides.');
      return;
    }

    if (!emailRegex.test(email)) {
      showErrorModal('Erreur', 'Veuillez entrer une adresse email valide.');
      return;
    }

    if (!passwordRegex.test(passwordCrea)) {
      showErrorModal('Erreur', 'Le mot de passe doit contenir au moins 12 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          passwordCrea,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        showErrorModal('Erreur', data.message || 'Erreur de connexion');
        return;
      } 

      setUsername('')
      setEmail('')
      setPasswordCrea('')
      setConfirmPassword('')
      setAcceptTerms(false)
      Alert.alert('Inscription réussie', 'Bienvenue agent veuillez vous connecter');
      changeForm();
    } catch (error) {
      showErrorModal('Erreur', 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier) {
      showErrorModal('Erreur', 'Identifiant invalide');
      return;
    }

    setIsLoading(true);
    try {
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showErrorModal('Erreur', data.message || 'Erreur de connexion');
        return;
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userId', JSON.stringify(data.user.id));
      await AsyncStorage.setItem('username', data.user.username);
      await AsyncStorage.setItem('isGuest', JSON.stringify(data.user.guest));
      if (rememberMe){
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('User', identifier);
          await AsyncStorage.setItem('password', password);
      } else {
        await AsyncStorage.setItem('rememberMe', 'false');
      }
      router.replace('/(tabs)/gamechoice');
    } catch (error) {
      showErrorModal('Erreur', 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/guest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showErrorModal('Erreur', data.message || 'Erreur de connexion');
        return;
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userId', JSON.stringify(data.user.id));
      await AsyncStorage.setItem('username', data.user.username);
      await AsyncStorage.setItem('isGuest', JSON.stringify(data.user.guest));
      router.replace('/(tabs)/gamechoice');
    } catch (error) {
      showErrorModal('Erreur', 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay isLoading={isLoading} />

      <ErrorModal
        visible={errorModalVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)} // Gérer la fermeture du modal
      />

      <Text style={styles.title}>KILLSPY</Text>
      {isLoginForm ? (
        <>
      <TextInput
        style={styles.input}
        placeholder={motTraduit(langIndex, 52)}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={motTraduit(langIndex, 53)}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={rememberMe}
          onValueChange={setRememberMe}
          color={rememberMe ? '#007AFF' : undefined}
        />
        <Text style={styles.checkboxLabel}>{motTraduit(langIndex, 57)}</Text>
      </View>
      </>
      ) : (
      <>
      <TextInput
        style={styles.input}
        placeholder={motTraduit(langIndex, 58)}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={motTraduit(langIndex, 59)}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Text style={styles.passwordInfo}>
        Le mot de passe doit contenir au moins 12 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial [@$!%*?&].
      </Text>

      <TextInput
        style={styles.input}
        placeholder={motTraduit(langIndex, 53)}
        value={passwordCrea}
        onChangeText={setPasswordCrea}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder={motTraduit(langIndex, 60)}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={acceptTerms}
          onValueChange={rgpdModal}
          color={acceptTerms ? '#007AFF' : undefined}
        />
        <Text style={styles.checkboxLabel} onPress={rgpdModal}>{motTraduit(langIndex, 61)}</Text>
      </View>
      </>
      )}
      <Pressable style={styles.button} onPress={isLoginForm ? handleLogin : handleSignup}>
        <Text style={styles.buttonText}>{isLoginForm ? motTraduit(langIndex, 56) : motTraduit(langIndex, 63)}</Text>
      </Pressable>

      <Pressable 
        style={styles.buttonGuest}
        onPress={handleGuest}
      >
        <Text style={styles.buttonText}>{motTraduit(langIndex, 50)}</Text>
      </Pressable>

      <Pressable 
        style={styles.textButton}

      >
        <Text style={styles.textButtonText}>{motTraduit(langIndex, 54)}</Text>
      </Pressable>

      <Pressable style={styles.textButton} onPress={changeForm}>
        <Text style={styles.textButtonText}>{isLoginForm ? motTraduit(langIndex, 55) : motTraduit(langIndex, 62)}</Text>
      </Pressable>

      <AlertModal
                visible={modalVisible}
                text1={"Nous nous engageons à protéger vos données personnelles. Voici les informations que nous collectons et conservons :"}
                text2={"Nom d'utilisateur / Adresse e-mail / Historique de jeu / Données de connexion / Préférences utilisateur" }
                text3={"Pour personnaliser votre expérience sur notre plateforme. Nous ne partageons pas vos données personnelles avec des tiers sans votre consentement, sauf si la loi l'exige. Vous avez le droit de demander l'accès à vos données, de les corriger ou de les supprimer à tout moment."}
                error1Button={isCountdownActive ? `Attendez ${countdown} secondes...` : motTraduit(langIndex, 71)}
                onPressError1={isCountdownActive ? () => { } : rgpdModalAccept}
                disabledError1={isCountdownActive}
                button1={motTraduit(langIndex, 72)}
                onPress1={rgpdModalRefuse}
      />

      <Text style={{ color: serverColor }}>{serverStatus}</Text>
      <Text style={styles.footer}>MIMIR Studio 2024 / V. {appVersion}</Text>
    </View>
  );
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
  passwordInfo: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
},
});
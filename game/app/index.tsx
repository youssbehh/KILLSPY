import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { appVersion, apiUrl } from '../config';
import { useLanguageStore } from '../store/languageStore';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginFormScreen() {
  const { langIndex } = useLanguageStore();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const validateIdentifier = (value: string) => {
    // Regex pour vérifier si c'est un email ou un username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return emailRegex.test(value) || usernameRegex.test(value);
  };

  const handleLogin = async () => {
    if (!validateIdentifier(identifier)) {
      Alert.alert('Erreur', 'Identifiant invalide');
      return;
    }

    try {
      // Détermine si l'identifiant est un email ou un username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: isEmail ? identifier : '',
          username: !isEmail ? identifier : '',
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erreur', data.message || 'Erreur de connexion');
        return;
      }

      // Stockage du token et redirection
      // TODO: Stocker data.token de manière sécurisée
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userId', data.id);
      if (rememberMe){
        await AsyncStorage.setItem('User', identifier);
        await AsyncStorage.setItem('password', data.password);
      }
      router.replace('/(tabs)/gamechoice');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    }
  };

  const handleGuest = async () => {

    try {
    console.log(`${apiUrl}`)
      const response = await fetch(`${apiUrl}/auth/guest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erreur', data.message || 'Erreur de connexion');
        return;
      }

      // Stockage du token et redirection
      // TODO: Stocker data.token de manière sécurisée
      await AsyncStorage.setItem('userId', data.user.id);
      await AsyncStorage.setItem('username', data.user.username);
      router.replace('/(tabs)/gamechoice');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KILLSPY</Text>

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

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>{motTraduit(langIndex, 56)}</Text>
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

      <Pressable 
        style={styles.textButton}

      >
        <Text style={styles.textButtonText}>{motTraduit(langIndex, 55)}</Text>
      </Pressable>

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
});
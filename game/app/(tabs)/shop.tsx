import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';

export default function ShopScreen() {
  const { langIndex } = useLanguageStore();
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(24 * 60 * 60);

  useEffect(() => {
    const fetchGuest = async () => {
        const isGuest = await AsyncStorage.getItem('isGuest');
        setIsGuest(isGuest === 'true');
    };
    fetchGuest();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 1, 0, 0); // Minuit du jour suivant
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      setTimeLeft(diff > 0 ? diff : 23 * 60 * 60);
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 23 * 60 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 4)}</Text>
      <Text style={styles.clock}>{formattedTime}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {!isGuest ? (
        <Text style={styles.title}>{motTraduit(langIndex, 69)}</Text>
       ) : (
        <Text>{motTraduit(langIndex, 70)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clock: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
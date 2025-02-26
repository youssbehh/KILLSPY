import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguageStore } from '../../store/languageStore';

export default function ProfilmmrScreen() {
  const { langIndex } = useLanguageStore();
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    const fetchGuest = async () => {
        const isGuest = await AsyncStorage.getItem('isGuest');
        setIsGuest(isGuest === 'true');
    };
    fetchGuest();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 17)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView>
      {!isGuest ? (
        <Text style={styles.title}>{motTraduit(langIndex, 69)}</Text>
       ) : (
        <Text>{motTraduit(langIndex, 70)}</Text>
      )}
      </ScrollView>
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
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
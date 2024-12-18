import React, { useState } from 'react';
import { motTraduit } from '@/components/translationHelper';
import { StyleSheet } from 'react-native';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../../config';

export default function TabOneScreen() {
  const [langIndex, setLangIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.titleh1}>{motTraduit(langIndex, 10)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
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
  },
  titleh2: {
    fontSize: 20,
  },
  boldText: {
    fontWeight: 'bold',
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
  },
});

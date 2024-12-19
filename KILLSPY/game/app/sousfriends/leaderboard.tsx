import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';

export default function LeaderboardScreen() {
  const [langIndex, setLangIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 16)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
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
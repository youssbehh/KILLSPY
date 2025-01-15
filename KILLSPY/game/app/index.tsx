import React, { useState } from 'react';
import { StyleSheet,Button } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../store/languageStore';

export default function LoginFormScreen() {
  const { langIndex } = useLanguageStore();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KILLSPY</Text>
      <Text onPress={() => router.replace('/(tabs)/gamechoice')}>{motTraduit(langIndex, 50)}</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
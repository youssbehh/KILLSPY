import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '@/src/stores/authStore';

export default function FriendslistScreen() {
  const { langIndex } = useLanguageStore();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 18)}</Text>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  separator: { marginVertical: 30, height: 1, width: '80%' },
});

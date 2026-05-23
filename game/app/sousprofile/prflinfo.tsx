import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
import { useMyStats } from '@/src/hooks/useGames';
import { useAuthStore } from '@/src/stores/authStore';

export default function PrflInfoScreen() {
  const { langIndex } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyStats();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 48)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text style={styles.row}>Pseudo : {user?.username ?? '—'}</Text>
          {data ? (
            <>
              <Text style={styles.row}>MMR : {data.user.mmr}</Text>
              <Text style={[styles.row, { color: data.rank.color }]}>Rang : {data.rank.label}</Text>
              <Text style={styles.row}>
                Inscrit depuis : {new Date(data.user.since).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text style={styles.row}>MMR : —</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  separator: { marginVertical: 20, height: 1, width: '80%' },
  row: { fontSize: 14, marginVertical: 4 },
});

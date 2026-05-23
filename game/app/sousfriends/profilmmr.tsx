import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useMyStats } from '@/src/hooks/useGames';
import { ModeStats } from '@/src/api/games';

const StatLine: React.FC<{ label: string; stats: ModeStats }> = ({ label, stats }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValues}>
      {stats.wins} V / {stats.losses} D{' '}
      {stats.total > 0 ? `(${Math.round(stats.winRate * 100)}%)` : ''}
    </Text>
  </View>
);

export default function ProfilmmrScreen() {
  const { langIndex } = useLanguageStore();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const { data, isLoading } = useMyStats();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 17)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {isGuest ? (
        <Text>{motTraduit(langIndex, 70)}</Text>
      ) : isLoading ? (
        <ActivityIndicator />
      ) : data ? (
        <>
          <Text style={[styles.rank, { color: data.rank.color }]}>{data.rank.label}</Text>
          <Text style={styles.mmr}>{data.user.mmr} MMR</Text>
          <View style={styles.divider} />
          <StatLine label="Compétitif" stats={data.stats.ranked} />
          <StatLine label="Partie rapide" stats={data.stats.quick} />
        </>
      ) : (
        <Text style={styles.title}>{motTraduit(langIndex, 69)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  separator: { marginVertical: 20, height: 1, width: '80%' },
  rank: { fontSize: 24, fontWeight: '700' },
  mmr: { fontSize: 18, marginTop: 4 },
  divider: { height: 1, width: '60%', backgroundColor: '#ddd', marginVertical: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', paddingVertical: 4 },
  statLabel: { fontWeight: '600' },
  statValues: { color: 'gray' },
});

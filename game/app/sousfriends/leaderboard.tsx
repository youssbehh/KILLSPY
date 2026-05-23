import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLeaderboard } from '@/src/hooks/useLeaderboard';
import { LeaderboardEntry } from '@/src/api/leaderboard';

export default function LeaderboardScreen() {
  const { langIndex } = useLanguageStore();
  const { data: leaderboard = [], isLoading } = useLeaderboard();

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.item}>
      <Text style={styles.position}>#{item.position}</Text>
      <View style={styles.middle}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={[styles.rank, { color: item.rank.color }]}>{item.rank.label}</Text>
      </View>
      <Text style={styles.mmr}>{item.mmr} MMR</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LoadingOverlay isLoading={isLoading} />
      <Text style={styles.title}>{motTraduit(langIndex, 16)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId.toString()}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  separator: { marginVertical: 20, height: 1, width: '80%' },
  list: { width: '100%' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  position: { width: 40, fontWeight: 'bold', fontSize: 16 },
  middle: { flex: 1 },
  username: { fontWeight: '600' },
  rank: { fontSize: 12 },
  mmr: { color: 'gray' },
});

import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
import { useMyHistory } from '@/src/hooks/useGames';
import { GameHistoryItem, PersistedMode } from '@/src/api/games';

const modeLabel = (mode: PersistedMode) => (mode === 'pvp_ranked' ? 'Ranked' : 'Quick');
const modeColor = (mode: PersistedMode) => (mode === 'pvp_ranked' ? '#ffd700' : '#007bff');

export default function PrflHistoricScreen() {
  const { langIndex } = useLanguageStore();
  const { data, isLoading } = useMyHistory();

  const renderItem = ({ item }: { item: GameHistoryItem }) => (
    <View style={[styles.item, item.won ? styles.win : styles.loss]}>
      <Text style={styles.itemOutcome}>{item.won ? 'V' : 'D'}</Text>
      <View style={styles.itemBody}>
        <View style={styles.row}>
          <Text style={[styles.modeChip, { backgroundColor: modeColor(item.mode) }]}>
            {modeLabel(item.mode)}
          </Text>
          <Text style={styles.itemDate}>{new Date(item.date).toLocaleString()}</Text>
        </View>
        {item.mode === 'pvp_ranked' ? (
          <Text style={styles.itemDelta}>
            {item.mmrDelta > 0 ? '+' : ''}
            {item.mmrDelta} MMR
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 49)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {isLoading ? (
        <ActivityIndicator />
      ) : data?.recentGames.length ? (
        <FlatList
          data={data.recentGames}
          renderItem={renderItem}
          keyExtractor={(g) => g.id.toString()}
          style={styles.list}
        />
      ) : (
        <Text style={styles.empty}>Aucune partie pour le moment.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  title: { fontSize: 20, fontWeight: 'bold' },
  separator: { marginVertical: 20, height: 1, width: '80%' },
  list: { width: '100%' },
  item: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  win: { backgroundColor: 'rgba(57,255,20,0.1)' },
  loss: { backgroundColor: 'rgba(231,76,60,0.1)' },
  itemOutcome: { fontSize: 22, fontWeight: 'bold', marginRight: 12, width: 24 },
  itemBody: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeChip: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  itemDate: { fontSize: 12 },
  itemDelta: { fontSize: 12, color: 'gray', marginTop: 2 },
  empty: { padding: 20, fontStyle: 'italic' },
});

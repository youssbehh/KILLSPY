import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
import LoadingOverlay from '@/components/LoadingOverlay';

interface LeaderboardItem {
  ID_Leaderboard: number;
  User: {
    Username: string;
    MMR: number;
    Ranks: { RankName: string }[];
  };
}

export default function LeaderboardScreen() {
  const { langIndex } = useLanguageStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try { 
        const response = await fetch(`${apiUrl}/leaderbord/getLeaderboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du classement');
        }
        const data = await response.json();
        setLeaderboard(data.leaderboard);

      } catch (error) {
        console.error("Erreur lors de la récupération du classement:", error);
      }
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const formatRank = (index: number) => {
    const rankSuffixes = ["er", "ème", "ème", "ème", "ème"]; // Suffixes pour les rangs
    return (index === 0 ? (index + 1) + rankSuffixes[0] : (index + 1) + rankSuffixes[1]);
  };

  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => (
    <View style={styles.item}>
      <Text style={styles.rank}>Rang: {formatRank(index)}</Text>
      <Text style={styles.username}>{item.User.Username}</Text>
      <Text style={styles.mmr}>MMR: {item.User.MMR}</Text>
      <Text style={styles.rank}>
      {item.User.Ranks && Array.isArray(item.User.Ranks) && item.User.Ranks.length > 0 
        ? item.User.Ranks[0].RankName 
        : 'Aucun rang'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LoadingOverlay isLoading={isLoading} />
      <Text style={styles.title}>{motTraduit(langIndex, 16)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <FlatList
        data={leaderboard}
        renderItem={({ item, index }) => renderItem({ item, index })}
        keyExtractor={(item) => item.ID_Leaderboard.toString()}
        style={styles.list}
      />
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
  list: {
    width: '100%',
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  username: {
    fontWeight: 'bold',
  },
  mmr: {
    color: 'gray',
  },
  rank: {
    color: 'blue',
  },
});
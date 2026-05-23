import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { motTraduit } from './translationHelper';
import { useLanguageStore } from '@/store/languageStore';
import { useRouter } from 'expo-router';
import { useMatchmaking } from '@/src/sockets/useMatchmaking';
import { useGameStore } from '@/src/stores/gameStore';

interface LoadingGameProps {
  gameMode: string;
  onGameFound: () => void;
}

const dotAnimation = ['.', '..', '...'];

export default function LoadingGame({ gameMode, onGameFound }: LoadingGameProps) {
  const { langIndex } = useLanguageStore();
  const router = useRouter();
  const [dotIndex, setDotIndex] = useState(0);

  const isVsBot = gameMode === motTraduit(langIndex, 12);
  const matchStatus = useGameStore((s) => s.matchStatus);
  const errorMessage = useGameStore((s) => s.errorMessage);

  const { joinQueue, leaveQueue } = useMatchmaking();

  // Animation des points
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % dotAnimation.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Mode VS bot : timeout simulé puis redirection
  useEffect(() => {
    if (!isVsBot) return;
    const timeout = setTimeout(() => {
      onGameFound();
      router.push('/play/bot');
    }, 1500);
    return () => clearTimeout(timeout);
  }, [isVsBot, onGameFound, router]);

  // Mode Partie Rapide : join matchmaking, redirect quand match found
  useEffect(() => {
    if (isVsBot) return;
    joinQueue();
    return () => {
      const status = useGameStore.getState().matchStatus;
      if (status === 'searching') leaveQueue();
    };
  }, [isVsBot]);

  useEffect(() => {
    if (isVsBot) return;
    if (matchStatus === 'countdown') {
      onGameFound();
      router.push('/play/partieRapide');
    }
  }, [matchStatus, isVsBot, onGameFound, router]);

  const handleCancelSearch = () => {
    if (!isVsBot) leaveQueue();
    router.back();
  };

  const isFound = matchStatus === 'countdown';
  const label = isFound
    ? motTraduit(langIndex, 34)
    : motTraduit(langIndex, 33) + dotAnimation[dotIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{gameMode}</Text>
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      <Text style={styles.loadingText}>{label}</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {!isFound && (
        <Pressable onPress={handleCancelSearch}>
          <Text style={styles.backButton}>{motTraduit(langIndex, 35)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  loader: { marginVertical: 20 },
  loadingText: { fontSize: 16 },
  errorText: { fontSize: 14, color: 'red', marginTop: 12 },
  backButton: { fontSize: 16, color: '#007AFF', marginTop: 20 },
});

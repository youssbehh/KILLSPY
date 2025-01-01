import { useState } from 'react';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import LoadingGame from '@/components/LoadingGame';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/store/languageStore';

export default function LoadingScreen() {
  const { mode } = useLocalSearchParams();
  const { langIndex } = useLanguageStore();
  const [isGameFound, setIsGameFound] = useState(false);

  return (
    <>
      <Stack.Screen 
        options={{
          title: motTraduit(langIndex, 33),
          headerBackTitle: ' ', 
          headerBackVisible: false,
          gestureEnabled: !isGameFound,
        }} 
      />
      <LoadingGame 
        gameMode={mode as string} 
        onGameFound={() => setIsGameFound(true)}
      />
    </>
  );
}
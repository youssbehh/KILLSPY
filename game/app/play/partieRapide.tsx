import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useGameStore } from '@/src/stores/gameStore';
import { useMatchmaking } from '@/src/sockets/useMatchmaking';
import { isActionLegal } from '@/src/game/gameEngine';
import { MatchmakingScreen } from '@/src/screens/MatchmakingScreen';
import { HUDScreen } from '@/src/screens/HUDScreen';
import { EndMatchScreen } from '@/src/screens/EndMatchScreen';

export default function PartieRapideScreen() {
  const router = useRouter();
  const { sendAction, leaveGame } = useMatchmaking();

  const { matchStatus, outcome, state, selectedAction, setSelectedAction } = useGameStore();

  const handleQuit = () => {
    leaveGame();
    router.replace('/(tabs)/gamechoice');
  };

  const handleRematch = () => {
    router.replace('/play/partieRapide');
  };

  const isFinished = matchStatus === 'finished';
  const isPlaying  = matchStatus === 'playing' || matchStatus === 'resolving';
  const isSearching = matchStatus === 'searching' || matchStatus === 'countdown' || matchStatus === 'idle';

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: !isFinished }} />

      {isSearching && (
        <MatchmakingScreen />
      )}

      {isPlaying && (
        <HUDScreen />
      )}

      {isFinished && (
        <EndMatchScreen
          outcome={outcome === 'won' ? 'won' : 'lost'}
          onContinue={() => router.replace('/(tabs)/gamechoice')}
          onRematch={handleRematch}
          onHome={() => router.replace('/(tabs)/gamechoice')}
        />
      )}
    </>
  );
}

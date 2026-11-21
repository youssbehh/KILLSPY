import React from 'react';
import { Stack } from 'expo-router';
import { LeaderboardScreen } from '@/src/screens/LeaderboardScreen';

export default function LeaderboardRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LeaderboardScreen />
    </>
  );
}

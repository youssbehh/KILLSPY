import React from 'react';
import { Stack } from 'expo-router';
import { HomeScreen } from '@/src/screens/HomeScreen';

export default function GameChoiceRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen />
    </>
  );
}

import React from 'react';
import { Stack } from 'expo-router';
import { ShopScreen } from '@/src/screens/ShopScreen';

export default function ShopRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ShopScreen />
    </>
  );
}

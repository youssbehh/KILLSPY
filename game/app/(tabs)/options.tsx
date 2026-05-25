import React from 'react';
import { Stack } from 'expo-router';
import { ProfileScreen } from '@/src/screens/ProfileScreen';

export default function ProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileScreen />
    </>
  );
}

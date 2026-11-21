import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import {
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { useAuthStore } from '@/src/stores/authStore';
import { KS } from '@/src/theme/colors';
import { queryClient } from '@/src/lib/queryClient';
import { useEquippedTheme } from '@/src/hooks/useEquippedTheme';
import { useSyncMe } from '@/src/hooks/useAuthFlow';

const isWeb = typeof window !== 'undefined';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BarlowCondensed_800ExtraBold,
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (!isWeb) return;
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!isWeb) return;
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return <RootLayoutNav />;
}

/**
 * Mount-once component that listens to the equipped ui_theme cosmetic and
 * pushes it into the local themeStore. Renders nothing.
 */
const ThemeSync: React.FC = () => {
  useEquippedTheme();
  useSyncMe();
  return null;
};

/** KILLSPY is a dark-only app: one navigation theme built from the design tokens. */
const NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: KS.bg,
    card: KS.bg,
    text: KS.ink,
    primary: KS.primary,
    border: KS.hairSoft,
  },
};

/**
 * Auth guard. Once the persisted session is rehydrated:
 * - no session → everything except the login screen redirects to it;
 * - session    → the login screen redirects to the home tab.
 */
const AuthGate: React.FC = () => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const onLogin = (segments as string[]).length === 0;
    if (!isAuthenticated && !onLogin) router.replace('/');
    else if (isAuthenticated && onLogin) router.replace('/(tabs)/gamechoice');
  }, [hydrated, isAuthenticated, segments, router]);

  return null;
};

function RootLayoutNav() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <ThemeProvider value={NAV_THEME}>
        <AuthGate />
        <Stack screenOptions={{ contentStyle: { backgroundColor: KS.bg } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

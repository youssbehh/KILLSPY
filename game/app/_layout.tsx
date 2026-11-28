import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { KS, STATUS_BAR_STYLE } from '@/src/theme/colors';
import { useRealtime } from '@/src/sockets/useRealtime';
import { isInMatch, useGameStore } from '@/src/stores/gameStore';
import { ChallengeOverlay } from '@/src/components/ks/ChallengeOverlay';
import { ThemeRestartBanner } from '@/src/components/ks/ThemeRestartBanner';
import { SplashScreen as Intro } from '@/src/screens/SplashScreen';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/src/lib/queryClient';
import { useEquippedTheme } from '@/src/hooks/useEquippedTheme';
import { useSyncMe } from '@/src/hooks/useAuthFlow';

/** False while the web build is statically rendered in Node (no splash to hide there). */
const isWeb = typeof window !== 'undefined';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
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
    // A font that fails to load falls back to the system font rather than a blank app.
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // The animated intro covers the first seconds of every cold start (session restore, first queries).
  const [introDone, setIntroDone] = useState(false);

  if (!loaded && !error) return null;
  return (
    <>
      <RootLayoutNav />
      {!introDone && (
        <View style={StyleSheet.absoluteFill}>
          <Intro onDone={() => setIntroDone(true)} />
        </View>
      )}
    </>
  );
}

/**
 * Mount-once component that listens to the equipped ui_theme cosmetic and
 * pushes it into the local themeStore. Renders nothing.
 */
const ThemeSync: React.FC = () => {
  useEquippedTheme();
  useSyncMe();
  useRealtime();
  return null;
};

const DUEL_ROUTE = '/play/partieRapide';

/**
 * A match can begin while the player is anywhere in the app — an accepted friend
 * challenge, or a connection that comes back mid-match. Bring them to the duel screen.
 */
const MatchRouter: React.FC = () => {
  const inMatch = useGameStore((s) => isInMatch(s.matchStatus));
  const pathname = usePathname();
  const router = useRouter();
  const navigationReady = useRootNavigationState()?.key != null;

  useEffect(() => {
    if (navigationReady && inMatch && pathname !== DUEL_ROUTE) router.push(DUEL_ROUTE);
  }, [navigationReady, inMatch, pathname, router]);

  return null;
};

/** Navigation colours follow the palette the app was started with. */
const NAV_THEME = {
  ...(STATUS_BAR_STYLE === 'dark' ? DefaultTheme : DarkTheme),
  colors: {
    ...(STATUS_BAR_STYLE === 'dark' ? DefaultTheme : DarkTheme).colors,
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
  // Navigating before the navigator is mounted throws (cold start on a deep link).
  const navigationReady = useRootNavigationState()?.key != null;

  useEffect(() => {
    if (!hydrated || !navigationReady) return;
    const first = (segments as string[])[0];
    // Screens reachable without a session: login and password reset.
    const isPublic = first === undefined || first === 'forgot-password';
    if (!isAuthenticated && !isPublic) router.replace('/');
    else if (isAuthenticated && isPublic) router.replace('/(tabs)/gamechoice');
  }, [hydrated, navigationReady, isAuthenticated, segments, router]);

  return null;
};

function RootLayoutNav() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <ThemeProvider value={NAV_THEME}>
        <AuthGate />
        <MatchRouter />
        <Stack screenOptions={{ contentStyle: { backgroundColor: KS.bg } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <ChallengeOverlay />
        <ThemeRestartBanner />
        <StatusBar style={STATUS_BAR_STYLE} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { RussoOne_400Regular } from '@expo-google-fonts/russo-one';
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

import { useColorScheme } from '@/components/useColorScheme';
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
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Stempel: require('../assets/fonts/Stempel.ttf'),
    LilitaOne: LilitaOne_400Regular,
    RussoOne: RussoOne_400Regular,
    BarlowCondensed_800ExtraBold,
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    ...FontAwesome.font,
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

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="Profil" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

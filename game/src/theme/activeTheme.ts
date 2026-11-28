import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_THEME_ID, ThemeId, themes } from './themes';

/**
 * The palette is read ONCE, when the app starts: every screen builds its styles
 * from it at load time. Equipping another theme saves it here and the app
 * restarts to apply it everywhere.
 *
 * Storage has to be synchronous (it runs before the first style is created):
 * localStorage on the web, SecureStore's sync API on phones.
 */
const KEY = 'killspy.activeTheme';

const readSync = (): string | null => {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
    return SecureStore.getItem(KEY);
  } catch {
    return null;
  }
};

const writeSync = (value: string) => {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, value);
    else SecureStore.setItem(KEY, value);
  } catch {
    // Not persisted: the theme will simply be applied again at the next sync.
  }
};

const isThemeId = (value: string | null): value is ThemeId => value !== null && value in themes;

const stored = readSync();

/** Theme the current run of the app was built with. */
export const ACTIVE_THEME_ID: ThemeId = isThemeId(stored) ? stored : DEFAULT_THEME_ID;

/** Remembers the theme for the next start. Returns true if a restart is needed to see it. */
export const saveActiveTheme = (id: ThemeId): boolean => {
  if (readSync() !== id) writeSync(id);
  return id !== ACTIVE_THEME_ID;
};

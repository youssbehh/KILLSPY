import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeId, DEFAULT_THEME_ID, themes } from '../theme/themes';

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: 'killspy.theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useTheme = () => {
  const themeId = useThemeStore((s) => s.themeId);
  return themes[themeId];
};

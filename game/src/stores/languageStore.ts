import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'languageIndex';

interface LanguageState {
  /** 0 = français, 1 = English. */
  langIndex: number;
  setLanguage: (index: number) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  langIndex: 0,
  setLanguage: async (index: number) => {
    set({ langIndex: index });
    await AsyncStorage.setItem(STORAGE_KEY, index.toString());
  },
}));

// Restore the saved language at startup (native and web).
AsyncStorage.getItem(STORAGE_KEY)
  .then((value) => {
    const index = value === null ? NaN : parseInt(value, 10);
    if (!Number.isNaN(index)) useLanguageStore.setState({ langIndex: index });
  })
  .catch(() => {
    // Storage unavailable: keep the default language.
  });

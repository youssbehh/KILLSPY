import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageState {
    langIndex: number;
    setLanguage: (index: number) => Promise<void>;
}

const isWeb = typeof window !== 'undefined' && window !== null;
const defaultLanguage = 0;

export const useLanguageStore = create<LanguageState>((set) => ({
    langIndex: 0,
    setLanguage: async (index: number) => {
        await AsyncStorage.setItem('languageIndex', index.toString());
        set({ langIndex: index });
    },
}));

const getStoredLanguage = async () => {
    if (!isWeb) return defaultLanguage;
    try {
        return await AsyncStorage.getItem('language');
    } catch (error) {
        console.error('Error reading language from storage:', error);
        return defaultLanguage;
    }
};

// Initialiser la langue depuis AsyncStorage au démarrage
if (isWeb) {
    AsyncStorage.getItem('languageIndex')
        .then(value => {
            if (value) {
                useLanguageStore.getState().setLanguage(parseInt(value));
            }
        });
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
const isWeb = typeof window !== 'undefined' && window !== null;
const defaultLanguage = 0;
export const useLanguageStore = create((set) => ({
    langIndex: 0,
    setLanguage: (index) => __awaiter(void 0, void 0, void 0, function* () {
        yield AsyncStorage.setItem('languageIndex', index.toString());
        set({ langIndex: index });
    }),
}));
const getStoredLanguage = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!isWeb)
        return defaultLanguage;
    try {
        return yield AsyncStorage.getItem('language');
    }
    catch (error) {
        console.error('Error reading language from storage:', error);
        return defaultLanguage;
    }
});
// Initialiser la langue depuis AsyncStorage au démarrage
if (isWeb) {
    AsyncStorage.getItem('languageIndex')
        .then(value => {
        if (value) {
            useLanguageStore.getState().setLanguage(parseInt(value));
        }
    });
}

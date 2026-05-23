import { fr } from './fr';
import { en } from './en';
import { I18nKey, I18N_KEYS } from './keys';
import { useLanguageStore } from '../../store/languageStore';

export type Locale = 'fr' | 'en';
const LOCALES: Record<number, Locale> = { 0: 'fr', 1: 'en' };
const TABLE: Record<Locale, Record<I18nKey, string>> = { fr, en };

const indexToKey: Record<number, I18nKey> = Object.fromEntries(
  Object.entries(I18N_KEYS).map(([key, idx]) => [idx, key as I18nKey]),
);

export const t = (key: I18nKey, langIndex = 0): string => {
  const locale = LOCALES[langIndex] ?? 'fr';
  return TABLE[locale][key] ?? '';
};

/** Legacy lookup by numeric index (backward-compat for motTraduit). */
export const tByIndex = (langIndex: number, wordIndex: number): string => {
  const key = indexToKey[wordIndex];
  if (!key) return '';
  return t(key, langIndex);
};

export const useT = () => {
  const langIndex = useLanguageStore((s) => s.langIndex);
  return (key: I18nKey) => t(key, langIndex);
};

export type { I18nKey };
export { I18N_KEYS };

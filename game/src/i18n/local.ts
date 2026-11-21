import { useLanguageStore } from '../stores/languageStore';

/**
 * Screen-local translations.
 *
 * A screen keeps its own strings next to its code:
 *
 *   const STRINGS = {
 *     fr: { title: 'Contacts', empty: 'Aucun ami' },
 *     en: { title: 'Contacts', empty: 'No friends yet' },
 *   } as const;
 *   const t = useLocalT(STRINGS);
 *   t('title')
 *
 * Both languages must define the same keys (enforced by the type).
 * Use `{name}` placeholders with the second argument: t('hello', { name: 'Bob' }).
 */
export type LocalStrings<K extends string> = { fr: Record<K, string>; en: Record<K, string> };

const LOCALES = ['fr', 'en'] as const;

export const useLocalT = <K extends string>(strings: LocalStrings<K>) => {
  const langIndex = useLanguageStore((s) => s.langIndex);
  const table = strings[LOCALES[langIndex] ?? 'fr'];
  return (key: K, vars?: Record<string, string | number>): string => {
    const text = table[key] ?? strings.fr[key] ?? key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
  };
};

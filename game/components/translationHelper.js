      import translations from './translations';

      export const motTraduit = (langIndex, wordIndex) => {
        return translations[langIndex][wordIndex] || '';
      };
import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { translations, TranslationKeys } from '../constants/translations';

interface LanguageContextProps {
  lang: 'en' | 'vi';
  toggleLanguage: () => void;
  t: (key: TranslationKeys) => string;
}

export const LanguageContext = createContext<LanguageContextProps>({
  lang: 'en',
  toggleLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<'en' | 'vi'>('en');

  const t = useCallback((key: TranslationKeys): string => translations[lang][key] || key, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
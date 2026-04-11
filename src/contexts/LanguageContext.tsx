'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang } from '@/types';
import { t, TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  T: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'lv',
  setLang: () => {},
  T: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('lv');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'lv' || saved === 'ru') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const T = (key: TranslationKey) => t(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, T }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);

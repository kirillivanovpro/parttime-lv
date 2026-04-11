'use client';

import { useLang } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <button
        onClick={() => setLang('lv')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'lv'
            ? 'text-[#8BC34A] font-bold'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        LV
      </button>
      <span className="text-gray-600">|</span>
      <button
        onClick={() => setLang('ru')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'ru'
            ? 'text-[#8BC34A] font-bold'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        RU
      </button>
    </div>
  );
}

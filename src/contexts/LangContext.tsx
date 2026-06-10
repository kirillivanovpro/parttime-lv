'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, type Lang, type T } from '@/lib/i18n'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: T
}

const LangContext = createContext<LangContextType | undefined>(undefined)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('lv')

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored === 'lv' || stored === 'ru') {
      setLangState(stored)
    }
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const context = useContext(LangContext)
  if (!context) throw new Error('useLang must be used within LangProvider')
  return context
}

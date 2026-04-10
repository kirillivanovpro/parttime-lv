'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Lang } from './i18n'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types/database'

interface AppContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  lang: 'lv',
  setLang: () => {},
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('lv')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', newLang)
    }
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null
    if (stored === 'lv' || stored === 'ru') setLangState(stored)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AppContext.Provider value={{ lang, setLang, user, profile, loading, refreshProfile }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

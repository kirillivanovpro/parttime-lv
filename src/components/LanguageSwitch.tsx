'use client'

import { useApp } from '@/lib/context'
import { Lang } from '@/lib/i18n'
import { clsx } from 'clsx'

export function LanguageSwitch() {
  const { lang, setLang } = useApp()

  const toggle = (l: Lang) => {
    setLang(l)
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-800 rounded-full p-1">
      <button
        onClick={() => toggle('lv')}
        className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium transition-all duration-200',
          lang === 'lv'
            ? 'bg-[#8BC34A] text-zinc-900'
            : 'text-zinc-400 hover:text-white'
        )}
      >
        LV
      </button>
      <button
        onClick={() => toggle('ru')}
        className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium transition-all duration-200',
          lang === 'ru'
            ? 'bg-[#8BC34A] text-zinc-900'
            : 'text-zinc-400 hover:text-white'
        )}
      >
        RU
      </button>
    </div>
  )
}

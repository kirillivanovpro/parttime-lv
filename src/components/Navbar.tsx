'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, User, PlusCircle, Home, LogOut, LogIn } from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from './Logo'
import { LanguageSwitch } from './LanguageSwitch'
import { useApp } from '@/lib/context'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export function Navbar() {
  const { lang, user } = useApp()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/', icon: Home, label: t(lang, 'nav_home') },
    { href: '/create', icon: PlusCircle, label: t(lang, 'nav_create') },
    { href: '/chat', icon: MessageCircle, label: t(lang, 'nav_chat') },
    { href: '/profile', icon: User, label: t(lang, 'nav_profile') },
  ]

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 h-16 items-center px-6">
        <Logo size="md" className="mr-8" />

        <div className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200',
                pathname === href
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors duration-200"
            >
              <LogOut size={18} />
              {t(lang, 'nav_logout')}
            </button>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#8BC34A] text-zinc-900 hover:bg-[#9CCC50] transition-colors duration-200"
            >
              <LogIn size={18} />
              {t(lang, 'nav_login')}
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 h-16 flex items-center">
        <div className="flex items-center justify-around w-full px-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors duration-200 flex-1',
                pathname === href
                  ? 'text-[#8BC34A]'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 h-14 flex items-center justify-between px-4">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          {!user && (
            <Link
              href="/auth"
              className="text-xs font-semibold bg-[#8BC34A] text-zinc-900 px-3 py-1.5 rounded-lg"
            >
              {t(lang, 'nav_login')}
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

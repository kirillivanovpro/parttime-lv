'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { lang, setLang, t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center select-none">
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Part<span className="animate-blink text-gray-900">:</span>time
              <span className="text-accent">.lv</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/listings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t.nav.listings}
            </Link>
            <Link
              href="/create"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t.nav.post}
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center gap-1 text-xs font-medium">
              <button
                onClick={() => setLang('lv')}
                className={`px-2 py-1 rounded transition-colors ${
                  lang === 'lv'
                    ? 'bg-accent text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                LV
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2 py-1 rounded transition-colors ${
                  lang === 'ru'
                    ? 'bg-accent text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                RU
              </button>
            </div>

            {user && profile ? (
              <>
                <span className="text-sm font-semibold text-gray-900">
                  €{profile.wallet_balance.toFixed(2)}
                </span>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t.nav.profile}
                </Link>
                {profile.is_admin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {t.nav.admin}
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors min-h-[44px]"
              >
                {t.nav.login}
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <Link
              href="/listings"
              className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              {t.nav.listings}
            </Link>
            <Link
              href="/create"
              className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => setMobileOpen(false)}
            >
              {t.nav.post}
            </Link>
            <div className="flex gap-2 px-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setLang('lv')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  lang === 'lv' ? 'bg-accent text-white' : 'text-gray-500 border border-gray-200'
                }`}
              >
                LV
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  lang === 'ru' ? 'bg-accent text-white' : 'text-gray-500 border border-gray-200'
                }`}
              >
                RU
              </button>
            </div>
            {user && profile ? (
              <div className="px-2 pt-2 border-t border-gray-100 space-y-2">
                <div className="text-sm font-semibold text-gray-900">
                  €{profile.wallet_balance.toFixed(2)}
                </div>
                <Link
                  href="/profile"
                  className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.profile}
                </Link>
                {profile.is_admin && (
                  <Link
                    href="/admin"
                    className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t.nav.admin}
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="block text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <div className="px-2 pt-2 border-t border-gray-100">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.login}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

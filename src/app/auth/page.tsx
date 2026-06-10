'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const { signIn, signUp } = useAuth()
  const { t } = useLang()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        const { error: err } = await signIn(email, password)
        if (err) { setError(err); return }
      } else {
        if (!fullName.trim()) { setError('Lūdzu ievadiet vārdu un uzvārdu'); return }
        const { error: err } = await signUp(email, password, fullName)
        if (err) { setError(err); return }
      }
      router.push(redirect)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            Part<span className="animate-blink">:</span>time<span className="text-accent">.lv</span>
          </div>
          <p className="text-gray-500 text-sm">
            {tab === 'login' ? 'Piesakieties savā kontā' : 'Izveidojiet jaunu kontu'}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('login'); setError(null) }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === 'login'
                  ? 'text-gray-900 border-b-2 border-accent'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.auth.login_tab}
            </button>
            <button
              onClick={() => { setTab('register'); setError(null) }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === 'register'
                  ? 'text-gray-900 border-b-2 border-accent'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.auth.register_tab}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {tab === 'register' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.auth.full_name}
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jānis Bērziņš"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jums@piemers.lv"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.auth.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
            >
              {loading
                ? t.auth.loading
                : tab === 'login'
                ? t.auth.submit_login
                : t.auth.submit_register}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>}>
      <AuthForm />
    </Suspense>
  )
}

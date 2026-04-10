'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/Logo'
import { useApp } from '@/lib/context'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'register'
type AuthMethod = 'email' | 'phone'

export default function AuthPage() {
  const { lang } = useApp()
  const router = useRouter()

  const [mode, setMode] = useState<AuthMode>('login')
  const [method, setMethod] = useState<AuthMethod>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearError = () => setError('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        })
        if (error) throw error
        setSuccess(lang === 'lv' ? 'Pārbaud e-pastu!' : 'Проверьте email!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(lang, 'error'))
    }
    setLoading(false)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+371${phone.replace(/\D/g, '')}`
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
      if (error) throw error
      setOtpSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(lang, 'error'))
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+371${phone.replace(/\D/g, '')}`
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })
      if (error) throw error
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(lang, 'error'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#8BC34A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-zinc-400 mt-3 text-sm">{t(lang, 'auth_subtitle')}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          {/* Method toggle */}
          <div className="flex bg-zinc-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMethod('email'); clearError() }}
              className={clsx(
                'flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                method === 'email' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              <Mail size={16} />
              {t(lang, 'auth_with_email')}
            </button>
            <button
              onClick={() => { setMethod('phone'); clearError() }}
              className={clsx(
                'flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                method === 'phone' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              <Phone size={16} />
              {t(lang, 'auth_with_phone')}
            </button>
          </div>

          {/* Email Form */}
          {method === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">{t(lang, 'auth_name')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
                    placeholder={t(lang, 'auth_name')}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">{t(lang, 'auth_email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">{t(lang, 'auth_password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">{t(lang, 'auth_confirm_password')}</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-xs">{error}</p>}
              {success && (
                <div className="flex items-center gap-2 text-[#8BC34A] text-xs">
                  <CheckCircle size={14} />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8BC34A] hover:bg-[#9CCC50] disabled:opacity-50 text-zinc-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {loading ? t(lang, 'loading') : mode === 'login' ? t(lang, 'auth_login') : t(lang, 'auth_register')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* Phone Form */}
          {method === 'phone' && (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">{t(lang, 'auth_phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  disabled={otpSent}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm disabled:opacity-50"
                  placeholder="+371 2X XXX XXX"
                />
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">{t(lang, 'auth_otp')}</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm tracking-widest text-center text-lg"
                    placeholder="000000"
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8BC34A] hover:bg-[#9CCC50] disabled:opacity-50 text-zinc-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {loading
                  ? t(lang, 'loading')
                  : otpSent
                    ? t(lang, 'auth_verify')
                    : t(lang, 'auth_send_otp')}
                {!loading && <ArrowRight size={16} />}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp('') }}
                  className="w-full text-zinc-400 text-xs hover:text-white transition-colors"
                >
                  {t(lang, 'back')}
                </button>
              )}
            </form>
          )}

          {/* Mode switcher (only for email) */}
          {method === 'email' && (
            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <span className="text-zinc-500 text-sm">
                {mode === 'login' ? t(lang, 'auth_no_account') : t(lang, 'auth_have_account')}
              </span>{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearError() }}
                className="text-[#8BC34A] font-medium text-sm hover:underline"
              >
                {mode === 'login' ? t(lang, 'auth_register') : t(lang, 'auth_login')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

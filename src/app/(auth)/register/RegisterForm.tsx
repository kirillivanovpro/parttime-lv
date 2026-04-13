'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { registerAction, googleOAuthAction, type RegisterState } from './actions'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
  </svg>
)

const inputClass =
  'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors'

export default function RegisterForm({ errorParam }: { errorParam?: string }) {
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker')
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    registerAction,
    null
  )

  if (state?.success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-white mb-3">Проверьте почту</h2>
            <p className="text-gray-400 text-sm">
              Мы отправили письмо с подтверждением. Перейдите по ссылке в письме, чтобы активировать аккаунт.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const formError = state?.error?._form
  const isExisting = formError?.includes('уже существует')
  const showExpiredTokenError = errorParam === 'expired_token'

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 mt-2 text-sm">Создайте аккаунт</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
          {/* Role selection cards */}
          <p className="text-sm text-gray-400 mb-3">Кто вы?</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('seeker')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === 'seeker'
                  ? 'border-[#8BC34A] bg-[#8BC34A]/10'
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
              }`}
            >
              <div className="text-2xl mb-1">🔍</div>
              <div className="text-sm font-semibold text-white">Ищу работу</div>
              <div className="text-xs text-gray-500 mt-0.5">Соискатель</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === 'employer'
                  ? 'border-[#8BC34A] bg-[#8BC34A]/10'
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
              }`}
            >
              <div className="text-2xl mb-1">💼</div>
              <div className="text-sm font-semibold text-white">Нанимаю</div>
              <div className="text-xs text-gray-500 mt-0.5">Работодатель</div>
            </button>
          </div>

          {/* Google OAuth — passes selected role via hidden input */}
          <form action={googleOAuthAction} className="mb-4">
            <input type="hidden" name="role" value={role} />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm"
            >
              <GoogleIcon />
              Продолжить с Google
            </button>
          </form>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-xs text-gray-500">или</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          {/* Registration form */}
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="role" value={role} />

            {/* Expired token banner */}
            {showExpiredTokenError && (
              <div className="p-3 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-400 text-sm">
                Ссылка подтверждения истекла. Зарегистрируйтесь снова — мы пришлём новое письмо.
              </div>
            )}

            {/* Form-level error */}
            {formError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {formError}
                {isExisting && (
                  <div className="mt-2 flex gap-3">
                    <Link href="/login" className="text-[#8BC34A] underline text-xs">Войти</Link>
                    <Link href="/reset-password" className="text-[#8BC34A] underline text-xs">Сбросить пароль</Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Имя</label>
              <input name="full_name" type="text" required placeholder="Иван Иванов" className={inputClass} />
              {state?.error?.full_name && (
                <p className="text-red-400 text-xs mt-1">{state.error.full_name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input name="email" type="email" required placeholder="ivan@example.lv" className={inputClass} />
              {state?.error?.email && (
                <p className="text-red-400 text-xs mt-1">{state.error.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Пароль</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Минимум 8 символов"
                className={inputClass}
              />
              {state?.error?.password && (
                <p className="text-red-400 text-xs mt-1">{state.error.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#8BC34A] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

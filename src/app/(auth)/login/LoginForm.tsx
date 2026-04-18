'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  loginAction,
  googleOAuthAction,
  resendConfirmationAction,
  type LoginState,
  type ResendState,
} from './actions'

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

export default function LoginForm({ errorParam }: { errorParam?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, null)
  const [resendState, resendAction, isResending] = useActionState<ResendState, FormData>(
    resendConfirmationAction,
    null
  )

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 mt-2 text-sm">Войдите в аккаунт</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
          {/* Expired token: resend confirmation */}
          {errorParam === 'expired_token' && !resendState?.sent && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-400 text-sm">
              <p className="font-medium mb-3">Ссылка подтверждения истекла</p>
              <form action={resendAction} className="space-y-2">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Ваш email"
                  className="w-full bg-[#0f0f0f] border border-yellow-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-600"
                />
                {resendState?.error && (
                  <p className="text-red-400 text-xs">{resendState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isResending ? 'Отправка...' : 'Отправить письмо повторно'}
                </button>
              </form>
            </div>
          )}

          {resendState?.sent && (
            <div className="mb-6 p-3 rounded-lg bg-green-900/30 border border-green-800 text-green-400 text-sm">
              Письмо отправлено — проверьте почту.
            </div>
          )}

          {errorParam === 'confirmation_failed' && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
              Не удалось подтвердить email. Попробуйте ещё раз.
            </div>
          )}

          {/* Google OAuth */}
          <form action={googleOAuthAction} className="mb-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm"
            >
              <GoogleIcon />
              Войти через Google
            </button>
          </form>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-xs text-gray-500">или</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          {/* Email + password form */}
          <form action={formAction} className="space-y-4">
            {state?.error?._form && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {state.error._form}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input name="email" type="email" required placeholder="ivan@example.lv" className={inputClass} />
              {state?.error?.email && (
                <p className="text-red-400 text-xs mt-1">{state.error.email[0]}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400">Пароль</label>
                <Link href="/reset-password" className="text-xs text-[#8BC34A] hover:underline">
                  Забыли пароль?
                </Link>
              </div>
              <input name="password" type="password" required placeholder="••••••••" className={inputClass} />
              {state?.error?.password && (
                <p className="text-red-400 text-xs mt-1">{state.error.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-[#8BC34A] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

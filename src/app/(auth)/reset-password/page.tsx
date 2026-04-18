'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { resetPasswordAction, type ResetState } from './actions'

const inputClass =
  'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    null
  )

  if (state?.success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-white mb-3">Проверьте почту</h2>
            <p className="text-gray-400 text-sm mb-6">
              Мы отправили инструкции по сбросу пароля.
            </p>
            <Link href="/login" className="text-[#8BC34A] hover:underline text-sm">
              ← Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 mt-2 text-sm">Сброс пароля</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
          <p className="text-gray-400 text-sm mb-6">
            Введите email, указанный при регистрации. Мы пришлём ссылку для сброса пароля.
          </p>

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

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Отправка...' : 'Отправить ссылку'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-[#8BC34A] hover:underline">
              ← Вернуться к входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

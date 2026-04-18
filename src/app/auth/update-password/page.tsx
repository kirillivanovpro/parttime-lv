'use client'

import { useActionState } from 'react'
import Logo from '@/components/Logo'
import { updatePasswordAction, type UpdatePasswordState } from './actions'

const inputClass =
  'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors'

export default function UpdatePasswordPage() {
  const [state, formAction, isPending] = useActionState<UpdatePasswordState, FormData>(
    updatePasswordAction,
    null
  )

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 mt-2 text-sm">Новый пароль</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
          <form action={formAction} className="space-y-4">
            {state?.error?._form && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {state.error._form}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Новый пароль</label>
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

            <div>
              <label className="block text-sm text-gray-400 mb-1">Повторите пароль</label>
              <input name="confirm" type="password" required placeholder="••••••••" className={inputClass} />
              {state?.error?.confirm && (
                <p className="text-red-400 text-xs mt-1">{state.error.confirm[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

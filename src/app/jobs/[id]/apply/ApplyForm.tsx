'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { applyToJobAction, type ApplicationFormState } from '../actions'

interface Props {
  jobId: string
  jobTitle: string
}

export default function ApplyForm({ jobId, jobTitle }: Props) {
  const [state, formAction, isPending] = useActionState<ApplicationFormState, FormData>(
    applyToJobAction,
    {}
  )
  const [message, setMessage] = useState('')

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="job_id" value={jobId} />

      {/* Error banner */}
      {state.error?._form && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">
          {state.error._form}
        </div>
      )}

      {/* Message textarea */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Сопроводительное письмо
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Расскажите, почему вы подходите для этой вакансии..."
          className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#8BC34A]/40 transition-colors resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">Необязательно</p>
          <p className="text-xs text-gray-500">{message.length}/1000</p>
        </div>
        {state.error?.message && (
          <p className="text-red-400 text-xs mt-1">{state.error.message}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Отправка...' : 'Откликнуться'}
      </button>
    </form>
  )
}

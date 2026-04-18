'use client'

import { useState } from 'react'

interface Props {
  jobId: string
  type: 'job_posting' | 'contact_unlock'
  label: string
}

export default function CheckoutButton({ jobId, type, label }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, job_id: jobId }),
      })
      const data = await res.json()

      if (data.already_unlocked) {
        window.location.reload()
        return
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Ошибка при создании сессии оплаты')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-[#8BC34A] text-black font-bold py-3.5 rounded-xl hover:bg-[#9DD45B] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {loading ? 'Переход к оплате...' : label}
      </button>
    </div>
  )
}

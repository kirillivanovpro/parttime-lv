'use client'

import { useState } from 'react'

interface Props {
  jobId: string
  initialEmail: string | null
  isLocked: boolean
  price: number
  isLoggedIn: boolean
  isSeeker: boolean
}

export default function ContactBlock({ jobId, initialEmail, isLocked, price, isLoggedIn, isSeeker }: Props) {
  const [email, setEmail] = useState<string | null>(initialEmail)
  const [locked, setLocked] = useState(isLocked)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceDisplay = (price / 100).toFixed(2)

  async function handleUnlock() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact_unlock', job_id: jobId }),
      })
      const data = await res.json()

      if (data.already_unlocked) {
        // Re-fetch contact info
        const contactRes = await fetch(`/api/jobs/${jobId}/contact`)
        const contactData = await contactRes.json()
        if (contactData.email) {
          setEmail(contactData.email)
          setLocked(false)
        }
        setLoading(false)
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

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Контакт работодателя</p>
        <p className="text-gray-400 text-sm mb-3">Войдите, чтобы открыть контакт работодателя.</p>
        <a
          href="/login"
          className="inline-block bg-[#8BC34A] text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#9DD45B] transition-colors"
        >
          Войти
        </a>
      </div>
    )
  }

  // Employer or admin — no contact block
  if (!isSeeker) return null

  // Unlocked
  if (!locked && email) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Контакт работодателя</p>
        <div className="flex items-center gap-2 bg-[#8BC34A]/10 border border-[#8BC34A]/20 rounded-xl px-4 py-3">
          <span className="text-[#8BC34A]">📧</span>
          <a href={`mailto:${email}`} className="text-[#8BC34A] text-sm font-medium hover:underline">
            {email}
          </a>
        </div>
        <p className="text-gray-600 text-xs mt-2">Напишите работодателю напрямую</p>
      </div>
    )
  }

  // Locked
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Контакт работодателя</p>
      <p className="text-gray-400 text-sm mb-3">
        Откройте email работодателя за <strong className="text-white">€{priceDisplay}</strong>
      </p>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <button
        onClick={handleUnlock}
        disabled={loading}
        className="w-full bg-[#8BC34A] text-black font-bold py-2.5 rounded-xl text-sm hover:bg-[#9DD45B] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Переход к оплате...' : `🔓 Открыть контакт за €${priceDisplay}`}
      </button>
      <p className="text-gray-600 text-xs mt-2">Оплата через Stripe · Один раз навсегда</p>
    </div>
  )
}

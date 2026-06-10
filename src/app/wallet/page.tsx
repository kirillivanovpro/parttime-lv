'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { supabase } from '@/lib/supabase'
import type { Payment } from '@/lib/types'

const PRESET_AMOUNTS = [2, 5, 10, 20]

function WalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success') || searchParams.get('session_id')
  const { user, profile, loading: authLoading, refreshProfile, getAccessToken } = useAuth()
  const { t } = useLang()

  const [amount, setAmount] = useState('5')
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [montonioLoading, setMontonioLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/wallet')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (success && user) {
      refreshProfile()
    }
  }, [success, user, refreshProfile])

  useEffect(() => {
    if (!user) return
    setPaymentsLoading(true)
    supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setPayments((data as Payment[]) ?? [])
        setPaymentsLoading(false)
      })
  }, [user])

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  const parsedAmount = parseFloat(amount) || 0
  const isValidAmount = parsedAmount >= 1

  const handleStripe = async () => {
    if (!isValidAmount) { setError(t.wallet.min_amount); return }
    setError(null)
    setStripeLoading(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/payments/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Kļūda'); return }
      if (data.url) window.location.href = data.url
    } finally {
      setStripeLoading(false)
    }
  }

  const handleMontonio = async () => {
    if (!isValidAmount) { setError(t.wallet.min_amount); return }
    setError(null)
    setMontonioLoading(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/montonio/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      const data = await res.json() as { paymentUrl?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Kļūda'); return }
      if (data.paymentUrl) window.location.href = data.paymentUrl
    } finally {
      setMontonioLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.wallet.page_title}</h1>

      {/* Balance card */}
      <div className="bg-accent rounded-2xl p-6 text-white mb-8">
        <div className="text-sm opacity-80 mb-1">{t.wallet.balance_label}</div>
        <div className="text-4xl font-bold">€{profile?.wallet_balance.toFixed(2) ?? '0.00'}</div>
      </div>

      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm font-medium">
          ✓ {t.wallet.success_msg}
        </div>
      )}

      {/* Top-up form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">{t.wallet.topup_title}</h2>

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">{t.wallet.preset_amounts}</p>
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors min-h-[44px] ${
                  parseFloat(amount) === preset
                    ? 'bg-accent text-white border-accent'
                    : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                }`}
              >
                €{preset}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.wallet.amount_label}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.50"
              placeholder="5.00"
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>
          {!isValidAmount && amount && (
            <p className="text-xs text-red-500 mt-1">{t.wallet.min_amount}</p>
          )}
        </div>

        {error && (
          <div role="alert" className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleStripe}
            disabled={stripeLoading || !isValidAmount}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-[#635BFF] text-[#635BFF] font-medium text-sm hover:bg-[#635BFF] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
          >
            {stripeLoading ? t.wallet.loading : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
                {t.wallet.pay_card}
              </>
            )}
          </button>
          <button
            onClick={handleMontonio}
            disabled={montonioLoading || !isValidAmount}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-accent text-accent font-medium text-sm hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
          >
            {montonioLoading ? t.wallet.loading : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t.wallet.pay_bank}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">{t.wallet.history_title}</h2>
        {paymentsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">{t.wallet.no_payments}</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {payment.type} — {payment.provider}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(payment.created_at).toLocaleDateString('lv-LV')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    payment.status === 'completed' ? 'bg-green-50 text-green-700' :
                    payment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {payment.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">€{payment.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>}>
      <WalletContent />
    </Suspense>
  )
}

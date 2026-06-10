'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import type { ListingCategory } from '@/lib/types'

const CATEGORIES: ListingCategory[] = ['cleaning', 'delivery', 'it', 'garden', 'moving', 'other']

export default function CreatePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, refreshProfile, getAccessToken } = useAuth()
  const { t } = useLang()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ListingCategory>('other')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/create')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  const hasBalance = profile ? profile.wallet_balance >= 0.5 : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasBalance) {
      setError(t.create.no_balance)
      return
    }
    if (!title.trim()) {
      setError('Lūdzu ievadiet nosaukumu')
      return
    }

    setSubmitting(true)
    try {
      const token = await getAccessToken()
      if (!token) { setError(t.create.no_auth); return }

      const res = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          price: price ? parseFloat(price) : null,
          location: location.trim() || null,
          contact_phone: phone.trim() || null,
          contact_email: email.trim() || null,
        }),
      })

      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? t.create.error_generic)
        return
      }
      await refreshProfile()
      router.push(`/listings/${data.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.create.page_title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.create.page_sub}</p>
      </div>

      {/* Balance warning */}
      {profile && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between ${
          hasBalance ? 'bg-accent-light text-green-800' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          <span>{t.create.balance_info}{profile.wallet_balance.toFixed(2)}</span>
          {!hasBalance && (
            <Link href="/wallet" className="font-medium underline hover:no-underline ml-2">
              {t.wallet.topup_title}
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.create.field_title}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Piemēram: Mājas uzkopšana Rīgā"
            maxLength={120}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.create.field_desc}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Aprakstiet pakalpojumu, pieredzi un citas detaļas..."
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.create.field_category}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{t.categories[cat]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.create.field_price}
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="15.00"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.create.field_location}
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Rīga, Vecrīga"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-50">
          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.create.field_phone}
            </label>
            <input
              id="contact_phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+371 2000 0000"
              autoComplete="tel"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.create.field_email}
            </label>
            <input
              id="contact_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jums@piemers.lv"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !hasBalance}
          className="w-full py-3.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
        >
          {submitting ? t.create.loading : t.create.submit}
        </button>
      </form>
    </div>
  )
}

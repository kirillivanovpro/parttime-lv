'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useApp } from '@/lib/context'
import { t, CATEGORIES } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ListingCategory } from '@/types/database'

export default function CreatePage() {
  return (
    <Suspense>
      <CreatePageInner />
    </Suspense>
  )
}

function CreatePageInner() {
  const { lang, user } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [type, setType] = useState<'offer' | 'request'>(
    (searchParams.get('type') as 'offer' | 'request') ?? 'offer'
  )
  const [category, setCategory] = useState<ListingCategory>('cleaning')
  const [titleLv, setTitleLv] = useState('')
  const [titleRu, setTitleRu] = useState('')
  const [descLv, setDescLv] = useState('')
  const [descRu, setDescRu] = useState('')
  const [price, setPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('hour')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) router.push('/auth')
  }, [user, router])

  const categoryLabels: Record<string, string> = {
    cleaning: t(lang, 'cat_cleaning'),
    dog_walking: t(lang, 'cat_dog_walking'),
    tutoring: t(lang, 'cat_tutoring'),
    photo_video: t(lang, 'cat_photo_video'),
    delivery: t(lang, 'cat_delivery'),
    repairs: t(lang, 'cat_repairs'),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        type,
        category,
        title_lv: titleLv,
        title_ru: titleRu,
        description_lv: descLv || null,
        description_ru: descRu || null,
        price: price ? parseFloat(price) : null,
        price_unit: priceUnit,
        location: location || null,
      })

      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(lang, 'error'))
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={64} className="text-[#8BC34A] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t(lang, 'create_success')}</h2>
          <p className="text-zinc-400">{t(lang, 'loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
          <ArrowLeft size={20} className="text-zinc-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">{t(lang, 'create_title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type toggle */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            {t(lang, 'create_type_offer')} / {t(lang, 'create_type_request')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('offer')}
              className={clsx(
                'flex items-center justify-center gap-2 py-4 rounded-xl border text-sm font-semibold transition-all duration-200',
                type === 'offer'
                  ? 'bg-[#8BC34A]/10 border-[#8BC34A] text-[#8BC34A]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              )}
            >
              {t(lang, 'create_type_offer')}
            </button>
            <button
              type="button"
              onClick={() => setType('request')}
              className={clsx(
                'flex items-center justify-center gap-2 py-4 rounded-xl border text-sm font-semibold transition-all duration-200',
                type === 'request'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              )}
            >
              {t(lang, 'create_type_request')}
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">{t(lang, 'create_category')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                  category === cat
                    ? 'bg-[#8BC34A]/10 border-[#8BC34A] text-[#8BC34A]'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                )}
              >
                <CategoryIcon category={cat} size={16} />
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t(lang, 'create_listing_title_lv')} *
            </label>
            <input
              type="text"
              value={titleLv}
              onChange={e => setTitleLv(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
              placeholder={lang === 'lv' ? 'Nosaukums...' : 'Название на латышском...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t(lang, 'create_listing_title_ru')} *
            </label>
            <input
              type="text"
              value={titleRu}
              onChange={e => setTitleRu(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
              placeholder={lang === 'lv' ? 'Nosaukums krieviski...' : 'Название...'}
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t(lang, 'create_description_lv')}</label>
            <textarea
              value={descLv}
              onChange={e => setDescLv(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm resize-none"
              placeholder={lang === 'lv' ? 'Apraksts latviski...' : 'Описание на латышском...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t(lang, 'create_description_ru')}</label>
            <textarea
              value={descRu}
              onChange={e => setDescRu(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm resize-none"
              placeholder={lang === 'lv' ? 'Apraksts krieviski...' : 'Описание на русском...'}
            />
          </div>
        </div>

        {/* Price & unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t(lang, 'create_price')}</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t(lang, 'create_price_unit')}</label>
            <select
              value={priceUnit}
              onChange={e => setPriceUnit(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
            >
              <option value="hour">{t(lang, 'price_unit_hour')}</option>
              <option value="job">{t(lang, 'price_unit_job')}</option>
              <option value="day">{t(lang, 'price_unit_day')}</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">{t(lang, 'create_location')}</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
            placeholder={lang === 'lv' ? 'Rīga, Vecrīga...' : 'Рига, Старый город...'}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8BC34A] hover:bg-[#9CCC50] disabled:opacity-50 text-zinc-900 font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? t(lang, 'loading') : t(lang, 'create_submit')}
        </button>
      </form>
    </div>
  )
}

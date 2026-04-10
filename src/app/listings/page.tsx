'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useApp } from '@/lib/context'
import { t, CATEGORIES } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { ListingCard } from '@/components/ListingCard'
import { CategoryBadge } from '@/components/CategoryIcon'
import { ListingWithProfile, ListingCategory } from '@/types/database'
import { clsx } from 'clsx'

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsPageInner />
    </Suspense>
  )
}

function ListingsPageInner() {
  const { lang } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [listings, setListings] = useState<ListingWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [activeCategory, setActiveCategory] = useState<ListingCategory | 'all'>('all')
  const [activeType, setActiveType] = useState<'all' | 'offer' | 'request'>(
    (searchParams.get('type') as 'offer' | 'request') ?? 'all'
  )

  useEffect(() => {
    fetchListings()
  }, [activeCategory, activeType])

  const fetchListings = async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (activeCategory !== 'all') query = query.eq('category', activeCategory)
    if (activeType !== 'all') query = query.eq('type', activeType)

    const { data } = await query
    setListings((data as ListingWithProfile[]) ?? [])
    setLoading(false)
  }

  const filtered = search
    ? listings.filter(l =>
        l.title_lv.toLowerCase().includes(search.toLowerCase()) ||
        l.title_ru.toLowerCase().includes(search.toLowerCase()) ||
        (l.description_lv ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.description_ru ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : listings

  const handleContact = (listing: ListingWithProfile) => {
    router.push(`/chat?listing=${listing.id}&user=${listing.user_id}`)
  }

  const categoryLabels: Record<string, string> = {
    all: t(lang, 'cat_all'),
    cleaning: t(lang, 'cat_cleaning'),
    dog_walking: t(lang, 'cat_dog_walking'),
    tutoring: t(lang, 'cat_tutoring'),
    photo_video: t(lang, 'cat_photo_video'),
    delivery: t(lang, 'cat_delivery'),
    repairs: t(lang, 'cat_repairs'),
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Search & filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t(lang, 'search_placeholder')}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {(['all', 'offer', 'request'] as const).map(typeOption => (
            <button
              key={typeOption}
              onClick={() => setActiveType(typeOption)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                activeType === typeOption
                  ? 'bg-[#8BC34A] text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              )}
            >
              {typeOption === 'all' ? t(lang, 'cat_all') : typeOption === 'offer' ? t(lang, 'offer_badge') : t(lang, 'request_badge')}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <CategoryBadge
            category={'all' as ListingCategory}
            label={categoryLabels['all']}
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {CATEGORIES.map(cat => (
            <CategoryBadge
              key={cat}
              category={cat}
              label={categoryLabels[cat]}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={16} className="text-zinc-500" />
        <span className="text-zinc-500 text-sm">{filtered.length} {lang === 'lv' ? 'rezultāti' : 'результатов'}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg">{t(lang, 'no_listings')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <ListingCard key={listing.id} listing={listing} onContact={handleContact} />
          ))}
        </div>
      )}
    </div>
  )
}

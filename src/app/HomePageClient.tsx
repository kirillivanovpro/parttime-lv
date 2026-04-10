'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/context'
import { t, CATEGORIES } from '@/lib/i18n'
import { ListingCard } from '@/components/ListingCard'
import { CategoryIcon, CategoryBadge } from '@/components/CategoryIcon'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { ListingWithProfile, ListingCategory } from '@/types/database'
import { useRouter } from 'next/navigation'

export function HomePageClient() {
  const { lang } = useApp()
  const router = useRouter()
  const [offerListings, setOfferListings] = useState<ListingWithProfile[]>([])
  const [requestListings, setRequestListings] = useState<ListingWithProfile[]>([])
  const [activeCategory, setActiveCategory] = useState<ListingCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [activeCategory])

  const fetchListings = async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory)
    }

    const { data } = await query
    const listings = (data as ListingWithProfile[]) ?? []

    setOfferListings(listings.filter(l => l.type === 'offer'))
    setRequestListings(listings.filter(l => l.type === 'request'))
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/listings?q=${encodeURIComponent(search.trim())}`)
    }
  }

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-950 border-b border-zinc-800">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#8BC34A]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#8BC34A]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {t(lang, 'hero_title')}
          </h1>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            {t(lang, 'hero_subtitle')}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t(lang, 'search_placeholder')}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <Search size={18} />
            </button>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create?type=offer"
              className="flex items-center justify-center gap-2 bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-105"
            >
              <span>{t(lang, 'hero_cta_offer')}</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/create?type=request"
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-105 border border-zinc-700"
            >
              <span>{t(lang, 'hero_cta_request')}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-14 md:top-16 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 py-3">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
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
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* "I can do" Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{t(lang, 'section_offer')}</h2>
              <p className="text-zinc-500 text-sm mt-1">{t(lang, 'section_offer_desc')}</p>
            </div>
            <Link
              href="/listings?type=offer"
              className="flex items-center gap-1 text-[#8BC34A] text-sm font-medium hover:gap-2 transition-all duration-200"
            >
              {t(lang, 'view_all')}
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : offerListings.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <CategoryIcon category={activeCategory === 'all' ? 'cleaning' : activeCategory} size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t(lang, 'no_listings')}</p>
              <Link href="/create?type=offer" className="mt-3 inline-flex items-center gap-1 text-[#8BC34A] text-sm">
                {t(lang, 'hero_cta_offer')} <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offerListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} onContact={handleContact} />
              ))}
            </div>
          )}
        </section>

        {/* "I need help" Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{t(lang, 'section_request')}</h2>
              <p className="text-zinc-500 text-sm mt-1">{t(lang, 'section_request_desc')}</p>
            </div>
            <Link
              href="/listings?type=request"
              className="flex items-center gap-1 text-[#8BC34A] text-sm font-medium hover:gap-2 transition-all duration-200"
            >
              {t(lang, 'view_all')}
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : requestListings.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <CategoryIcon category={activeCategory === 'all' ? 'repairs' : activeCategory} size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t(lang, 'no_listings')}</p>
              <Link href="/create?type=request" className="mt-3 inline-flex items-center gap-1 text-[#8BC34A] text-sm">
                {t(lang, 'hero_cta_request')} <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requestListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} onContact={handleContact} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

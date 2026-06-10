'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/contexts/LangContext'
import ListingCard from '@/components/ListingCard'
import type { Listing, ListingCategory } from '@/lib/types'

const CATEGORIES: { value: ListingCategory | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'cleaning', labelKey: 'cleaning' },
  { value: 'delivery', labelKey: 'delivery' },
  { value: 'it', labelKey: 'it' },
  { value: 'garden', labelKey: 'garden' },
  { value: 'moving', labelKey: 'moving' },
  { value: 'other', labelKey: 'other' },
]

export default function ListingsPage() {
  const { t } = useLang()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('id,user_id,title,description,category,price,location,is_paid,is_active,view_count,created_at')
      .eq('is_active', true)
      .eq('is_paid', true)
      .order('created_at', { ascending: false })

    if (category !== 'all') {
      query = query.eq('category', category)
    }
    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    const { data } = await query.limit(50)
    setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [category, search])

  useEffect(() => {
    const timer = setTimeout(fetchListings, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchListings, search])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.listings.search_placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(({ value, labelKey }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
              category === value
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {value === 'all' ? t.listings.all_categories : t.categories[value as ListingCategory]}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 font-medium">{t.listings.no_listings}</p>
          <p className="text-gray-400 text-sm mt-1">{t.listings.no_listings_sub}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

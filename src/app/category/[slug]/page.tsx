'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/contexts/LangContext'
import ListingCard from '@/components/ListingCard'
import type { Listing, ListingCategory } from '@/lib/types'

const VALID_CATEGORIES: ListingCategory[] = ['cleaning', 'delivery', 'it', 'garden', 'moving', 'other']

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const { t } = useLang()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  const category = VALID_CATEGORIES.includes(slug as ListingCategory) ? (slug as ListingCategory) : null

  useEffect(() => {
    if (!category) { setLoading(false); return }
    supabase
      .from('listings')
      .select('id,user_id,title,description,category,price,location,is_paid,is_active,view_count,created_at')
      .eq('category', category)
      .eq('is_active', true)
      .eq('is_paid', true)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setListings((data as Listing[]) ?? [])
        setLoading(false)
      })
  }, [category])

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Kategorija nav atrasta</p>
        <Link href="/listings" className="mt-4 inline-block text-sm text-accent">← Atpakaļ</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.common.back}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t.categories[category]}</h1>
        <p className="text-gray-500 mt-2 text-sm">{t.category_desc[category]}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">{t.listings.no_listings}</p>
          <Link href="/create" className="mt-4 inline-block text-sm text-accent hover:text-accent-hover">
            {t.home.cta_post} →
          </Link>
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

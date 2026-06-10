'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/contexts/LangContext'
import ListingCard from '@/components/ListingCard'
import CategoryGrid from '@/components/CategoryGrid'
import type { Listing } from '@/lib/types'

interface Stats {
  listings: number
  users: number
}

export default function HomePage() {
  const { t } = useLang()
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<Stats>({ listings: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [listingsRes, usersRes, listingsCountRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id,user_id,title,description,category,price,location,is_paid,is_active,view_count,created_at')
          .eq('is_active', true)
          .eq('is_paid', true)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_paid', true),
      ])

      setListings((listingsRes.data as Listing[]) ?? [])
      setStats({
        listings: listingsCountRes.count ?? 0,
        users: usersRes.count ?? 0,
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-16 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {t.home.hero_title}
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            {t.home.hero_sub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors min-h-[48px]"
            >
              {t.home.cta}
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:border-accent hover:text-accent transition-colors min-h-[48px]"
            >
              {t.home.cta_post}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-accent-light py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.listings}</div>
              <div className="text-sm text-gray-500 mt-1">{t.home.stats_listings}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.users}</div>
              <div className="text-sm text-gray-500 mt-1">{t.home.stats_users}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">6</div>
              <div className="text-sm text-gray-500 mt-1">{t.home.stats_categories}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <CategoryGrid t={t} />
        </div>
      </section>

      {/* Latest listings */}
      <section className="py-12 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t.home.latest}</h2>
            <Link
              href="/listings"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {t.home.view_all} →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-40 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{t.listings.no_listings}</p>
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
      </section>
    </>
  )
}

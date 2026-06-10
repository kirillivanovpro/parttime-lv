'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import type { Listing, ContactUnlock } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, getAccessToken } = useAuth()
  const { t } = useLang()

  const [listings, setListings] = useState<Listing[]>([])
  const [unlocks, setUnlocks] = useState<(ContactUnlock & { listing_title?: string })[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'unlocks'>('listings')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?redirect=/profile')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from('listings')
        .select('id,user_id,title,description,category,price,location,is_paid,is_active,view_count,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('contact_unlocks')
        .select('id, user_id, listing_id, created_at, listings(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]).then(([listingsRes, unlocksRes]) => {
      setListings((listingsRes.data as Listing[]) ?? [])
      const rawUnlocks = (unlocksRes.data ?? []) as unknown as Array<ContactUnlock & { listings?: Array<{ title: string }> | null }>
      setUnlocks(rawUnlocks.map((u) => ({ ...u, listing_title: Array.isArray(u.listings) ? u.listings[0]?.title : undefined })))
      setLoading(false)
    })
  }, [user])

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const token = await getAccessToken()
    if (!token) return
    await fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !currentActive }),
    })
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !currentActive } : l))
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.admin.confirm_delete)) return
    const token = await getAccessToken()
    if (!token) return
    await fetch(`/api/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  if (authLoading || !user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.profile.page_title}</h1>

      {/* Profile card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
              <span className="text-accent font-bold text-lg">
                {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{profile?.full_name ?? '—'}</div>
              <div className="text-sm text-gray-400">{profile?.email}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {t.profile.member_since}: {profile ? new Date(profile.created_at).toLocaleDateString('lv-LV') : ''}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{t.profile.wallet_balance}</div>
            <div className="text-xl font-bold text-gray-900">€{profile?.wallet_balance.toFixed(2) ?? '0.00'}</div>
            <Link href="/wallet" className="text-xs text-accent hover:text-accent-hover transition-colors">
              {t.profile.topup_wallet} →
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'listings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.profile.my_listings} ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('unlocks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'unlocks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.profile.unlocked_contacts} ({unlocks.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : activeTab === 'listings' ? (
        listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{t.profile.no_listings}</p>
            <Link href="/create" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
              {t.profile.create_first}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between px-4 py-4 bg-white border border-gray-100 rounded-xl gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-accent transition-colors text-sm truncate block">
                    {listing.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${listing.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {listing.is_active ? t.profile.status_active : t.profile.status_inactive}
                    </span>
                    <span className="text-xs text-gray-400">{t.listings.price}: {listing.price !== null ? `€${listing.price.toFixed(2)}` : '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(listing.id, listing.is_active)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors min-h-[36px]"
                  >
                    {listing.is_active ? t.profile.deactivate : t.profile.activate}
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors min-h-[36px]"
                  >
                    {t.profile.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        unlocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">{t.profile.no_unlocks}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unlocks.map((unlock) => (
              <div key={unlock.id} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl">
                <div>
                  <Link href={`/listings/${unlock.listing_id}`} className="text-sm font-medium text-gray-900 hover:text-accent transition-colors">
                    {unlock.listing_title ?? unlock.listing_id}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(unlock.created_at).toLocaleDateString('lv-LV')}
                  </div>
                </div>
                <span className="text-xs text-accent font-medium">€0.50</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

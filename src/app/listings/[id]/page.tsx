'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import type { Listing, ListingCategory } from '@/lib/types'

const CATEGORY_COLORS: Record<ListingCategory, string> = {
  cleaning: 'bg-blue-50 text-blue-700',
  delivery: 'bg-orange-50 text-orange-700',
  it: 'bg-purple-50 text-purple-700',
  garden: 'bg-green-50 text-green-700',
  moving: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-50 text-gray-600',
}

interface ContactInfo {
  phone: string | null
  email: string | null
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, profile, refreshProfile, getAccessToken } = useAuth()
  const { t } = useLang()

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const fetchContact = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    const res = await fetch(`/api/listings/${id}/contact`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json() as ContactInfo
      setContact(data)
    }
  }, [id, getAccessToken])

  useEffect(() => {
    async function fetchListing() {
      const { data } = await supabase
        .from('listings')
        .select('id,user_id,title,description,category,price,location,is_paid,is_active,view_count,created_at')
        .eq('id', id)
        .single()

      if (!data) {
        setLoading(false)
        return
      }
      setListing(data as Listing)

      // Increment view count (fire and forget)
      supabase
        .from('listings')
        .update({ view_count: data.view_count + 1 })
        .eq('id', id)

      setLoading(false)
    }
    fetchListing()
  }, [id])

  useEffect(() => {
    if (!user || !listing) return

    async function checkUnlock() {
      const { data } = await supabase
        .from('contact_unlocks')
        .select('id')
        .eq('user_id', user!.id)
        .eq('listing_id', id)
        .maybeSingle()

      if (data) {
        setIsUnlocked(true)
        await fetchContact()
      }
    }
    checkUnlock()
  }, [user, listing, id, fetchContact])

  const handleUnlock = async () => {
    if (!user) { router.push(`/auth?redirect=/listings/${id}`); return }
    setUnlocking(true)
    setUnlockError(null)

    try {
      const token = await getAccessToken()
      if (!token) { setUnlockError('Lūdzu piesakieties vēlreiz'); return }

      const res = await fetch(`/api/listings/${id}/unlock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { phone?: string | null; email?: string | null; error?: string }

      if (!res.ok) {
        setUnlockError(data.error ?? t.listing.insufficient)
        return
      }

      setContact({ phone: data.phone ?? null, email: data.email ?? null })
      setIsUnlocked(true)
      await refreshProfile()
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-24" />
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-gray-500">{t.listing.not_found}</p>
        <Link href="/listings" className="mt-4 inline-block text-sm text-accent">
          ← {t.listing.back}
        </Link>
      </div>
    )
  }

  const categoryLabel = t.categories[listing.category]
  const colorClass = CATEGORY_COLORS[listing.category]
  const date = new Date(listing.created_at).toLocaleDateString('lv-LV', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.listing.back}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
              {categoryLabel}
            </span>
            {listing.price !== null && (
              <span className="text-xl font-bold text-gray-900">
                €{listing.price.toFixed(2)}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">{listing.title}</h1>

          {listing.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t.listing.description_label}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-8 py-4 border-t border-gray-50">
            {listing.location && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{listing.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{listing.view_count} {t.listing.views_label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{date}</span>
            </div>
          </div>

          {/* Contact section */}
          <div className="border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t.listing.contact_section}</h2>

            {isUnlocked && contact ? (
              <div className="space-y-3">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-accent transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">{t.listing.phone_label}</div>
                      <div className="font-medium">{contact.phone}</div>
                    </div>
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-accent transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">{t.listing.email_label}</div>
                      <div className="font-medium">{contact.email}</div>
                    </div>
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-xs text-green-600 mt-2 pt-2 border-t border-gray-50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.listing.unlocked_label}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t.listing.contact_hidden}</p>
                <p className="text-xs text-gray-400 mb-4">{t.listing.contact_hidden_sub}</p>

                {!user ? (
                  <Link
                    href={`/auth?redirect=/listings/${id}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors min-h-[44px]"
                  >
                    {t.listing.login_to_unlock}
                  </Link>
                ) : (
                  <>
                    {profile && profile.wallet_balance < 0.5 && (
                      <p className="text-xs text-red-500 mb-3">
                        {t.listing.insufficient}{' '}
                        <Link href="/wallet" className="underline hover:text-red-700">
                          {t.wallet.topup_title}
                        </Link>
                      </p>
                    )}
                    {unlockError && (
                      <p className="text-xs text-red-500 mb-3" role="alert">{unlockError}</p>
                    )}
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                    >
                      {unlocking ? t.listing.unlock_loading : t.listing.unlock_btn}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

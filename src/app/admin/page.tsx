'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import type { Listing, Profile } from '@/lib/types'

interface Stats {
  total_listings: number
  active_listings: number
  total_users: number
  total_revenue: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading, getAccessToken } = useAuth()
  const { t } = useLang()

  const [tab, setTab] = useState<'listings' | 'users'>('listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [stats, setStats] = useState<Stats>({ total_listings: 0, active_listings: 0, total_users: 0, total_revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || (profile && !profile.is_admin))) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (!user || !profile?.is_admin) return

    async function fetchData() {
      const token = await getAccessToken()
      if (!token) return

      const [listingsRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/listings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        Promise.all([
          supabase.from('listings').select('id', { count: 'exact', head: true }),
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('amount').eq('status', 'completed'),
        ]),
      ])

      if (listingsRes.ok) setListings(await listingsRes.json() as Listing[])
      if (usersRes.ok) setUsers(await usersRes.json() as Profile[])

      const [totalL, activeL, totalU, payments] = statsRes
      const revenue = (payments.data ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
      setStats({
        total_listings: totalL.count ?? 0,
        active_listings: activeL.count ?? 0,
        total_users: totalU.count ?? 0,
        total_revenue: revenue,
      })
      setLoading(false)
    }
    fetchData()
  }, [user, profile, getAccessToken])

  const handleToggleListing = async (id: string, current: boolean) => {
    const token = await getAccessToken()
    if (!token) return
    await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !current }),
    })
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !current } : l))
  }

  const handleDeleteListing = async (id: string) => {
    if (!confirm(t.admin.confirm_delete)) return
    const token = await getAccessToken()
    if (!token) return
    await fetch(`/api/admin/listings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  if (authLoading || !user || !profile) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>
  }

  if (!profile.is_admin) {
    return <div className="text-center py-20 text-gray-400">{t.admin.access_denied}</div>
  }

  const STAT_CARDS = [
    { label: t.admin.stats_total_listings, value: stats.total_listings },
    { label: t.admin.stats_active_listings, value: stats.active_listings },
    { label: t.admin.stats_total_users, value: stats.total_users },
    { label: t.admin.stats_total_payments, value: `€${stats.total_revenue.toFixed(2)}` },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.admin.page_title}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('listings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'listings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          {t.admin.listings_tab}
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          {t.admin.users_tab}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : tab === 'listings' ? (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t.admin.col_title}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">{t.admin.col_category}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t.admin.col_status}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">{t.admin.col_created}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">{t.admin.col_actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-accent transition-colors truncate block max-w-[200px]">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">{t.categories[listing.category]}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listing.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {listing.is_active ? t.profile.status_active : t.profile.status_inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {new Date(listing.created_at).toLocaleDateString('lv-LV')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleListing(listing.id, listing.is_active)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
                        >
                          {listing.is_active ? t.admin.btn_deactivate : t.admin.btn_activate}
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          {t.admin.btn_delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t.admin.col_email}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">{t.admin.col_name}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t.admin.col_balance}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t.admin.col_admin}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">{t.admin.col_created}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.full_name ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell font-medium">€{u.wallet_balance.toFixed(2)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.is_admin && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-green-700 font-medium">Admin</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {new Date(u.created_at).toLocaleDateString('lv-LV')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

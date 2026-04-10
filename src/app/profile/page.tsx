'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User as UserIcon, Edit2, Save, X, Plus, Minus,
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
  Star, Package, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useApp } from '@/lib/context'
import { t } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Profile, Listing, Transaction } from '@/types/database'
import { ListingCard } from '@/components/ListingCard'
import { RatingDisplay } from '@/components/StarRating'
import { ListingWithProfile } from '@/types/database'

type Tab = 'listings' | 'wallet' | 'reviews'

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  )
}

function ProfilePageInner() {
  const { lang, user, profile: myProfile, refreshProfile } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewUserId = searchParams.get('id')

  const isOwnProfile = !viewUserId || viewUserId === user?.id

  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<ListingWithProfile[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('listings')
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Wallet state
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)

  useEffect(() => {
    if (!user && !viewUserId) {
      router.push('/auth')
      return
    }
    const targetId = viewUserId ?? user?.id
    if (targetId) {
      fetchProfile(targetId)
      fetchListings(targetId)
    }
    if (isOwnProfile && user) {
      fetchTransactions(user.id)
    }
  }, [user, viewUserId])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setDisplayName(data?.display_name ?? '')
    setBio(data?.bio ?? '')
    setLoading(false)
  }

  const fetchListings = async (userId: string) => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setListings((data as ListingWithProfile[]) ?? [])
  }

  const fetchTransactions = async (userId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setTransactions(data ?? [])
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ display_name: displayName, bio, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
    await fetchProfile(user.id)
    setEditing(false)
    setSaving(false)
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !depositAmount) return
    setDepositLoading(true)

    const amount = parseFloat(depositAmount)
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount,
      type: 'deposit',
      description: lang === 'lv' ? 'Maka papildināšana' : 'Пополнение кошелька',
    })

    await supabase
      .from('profiles')
      .update({ wallet_balance: (profile?.wallet_balance ?? 0) + amount })
      .eq('id', user.id)

    await refreshProfile()
    await fetchProfile(user.id)
    await fetchTransactions(user.id)

    setDepositAmount('')
    setDepositLoading(false)
    setDepositSuccess(true)
    setShowDeposit(false)
    setTimeout(() => setDepositSuccess(false), 3000)
  }

  const handleToggleListing = async (listingId: string, isActive: boolean) => {
    await supabase.from('listings').update({ is_active: !isActive }).eq('id', listingId)
    if (user) fetchListings(user.id)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-48 animate-pulse mb-6" />
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-96 animate-pulse" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-zinc-500">
        <p>{t(lang, 'error')}</p>
      </div>
    )
  }

  const txTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft size={16} className="text-[#8BC34A]" />
      case 'withdrawal': return <ArrowUpRight size={16} className="text-red-400" />
      case 'earning': return <TrendingUp size={16} className="text-[#8BC34A]" />
      case 'payment': return <TrendingDown size={16} className="text-red-400" />
      default: return null
    }
  }

  const txTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      deposit: t(lang, 'transaction_deposit'),
      withdrawal: t(lang, 'transaction_withdrawal'),
      earning: t(lang, 'transaction_earning'),
      payment: t(lang, 'transaction_payment'),
    }
    return map[type] ?? type
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Profile header card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          {/* Avatar + info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border-2 border-[#8BC34A]/30">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <UserIcon size={28} className="text-zinc-500" />
              )}
            </div>
            <div>
              {editing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-[#8BC34A] mb-1"
                />
              ) : (
                <h1 className="text-xl font-bold text-white">{profile.display_name ?? 'User'}</h1>
              )}
              {profile.rating_count > 0 && (
                <RatingDisplay
                  avg={profile.rating_avg}
                  count={profile.rating_count}
                  reviewsLabel={t(lang, 'reviews')}
                  reviewSingular={t(lang, 'review_singular')}
                />
              )}
            </div>
          </div>

          {/* Edit/save buttons */}
          {isOwnProfile && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-semibold px-3 py-2 rounded-xl text-sm transition-colors"
                  >
                    <Save size={14} />
                    {t(lang, 'profile_save')}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-sm transition-colors"
                >
                  <Edit2 size={14} />
                  {t(lang, 'profile_edit')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="mt-4">
          {editing ? (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder={t(lang, 'profile_bio')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] text-sm resize-none"
            />
          ) : (
            profile.bio && <p className="text-zinc-400 text-sm">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{listings.length}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{t(lang, 'profile_my_listings')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{profile.rating_count}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{t(lang, 'profile_reviews')}</p>
          </div>
          {isOwnProfile && (
            <div className="text-center">
              <p className="text-2xl font-bold text-[#8BC34A]">€{profile.wallet_balance.toFixed(2)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{t(lang, 'profile_balance')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 gap-1">
        {([
          { key: 'listings', icon: Package, label: t(lang, 'profile_my_listings') },
          ...(isOwnProfile ? [{ key: 'wallet', icon: Wallet, label: t(lang, 'profile_wallet') }] : []),
          { key: 'reviews', icon: Star, label: t(lang, 'profile_reviews') },
        ] as { key: Tab; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === key ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: Listings */}
      {activeTab === 'listings' && (
        <div>
          {isOwnProfile && (
            <div className="flex justify-end mb-4">
              <Link
                href="/create"
                className="flex items-center gap-2 bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus size={16} />
                {t(lang, 'nav_create')}
              </Link>
            </div>
          )}
          {listings.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t(lang, 'profile_no_listings')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listings.map(listing => (
                <div key={listing.id} className="relative">
                  <ListingCard listing={listing} />
                  {isOwnProfile && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => handleToggleListing(listing.id, listing.is_active)}
                        className={clsx(
                          'text-xs px-2 py-1 rounded-full font-medium transition-colors',
                          listing.is_active
                            ? 'bg-zinc-800/90 text-zinc-300 hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-zinc-800/90 text-zinc-500 hover:bg-[#8BC34A]/20 hover:text-[#8BC34A]'
                        )}
                      >
                        {listing.is_active ? (lang === 'lv' ? 'Aktīvs' : 'Активно') : (lang === 'lv' ? 'Neaktīvs' : 'Неактивно')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Wallet */}
      {activeTab === 'wallet' && isOwnProfile && (
        <div className="space-y-4">
          {/* Balance card */}
          <div className="bg-gradient-to-br from-[#8BC34A]/20 to-zinc-900 border border-[#8BC34A]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={20} className="text-[#8BC34A]" />
              <span className="text-zinc-400 text-sm">{t(lang, 'profile_balance')}</span>
            </div>
            <p className="text-4xl font-bold text-white mb-6">
              €{profile.wallet_balance.toFixed(2)}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeposit(!showDeposit)}
                className="flex items-center gap-2 bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus size={16} />
                {t(lang, 'profile_deposit')}
              </button>
            </div>
          </div>

          {/* Deposit form */}
          {showDeposit && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <form onSubmit={handleDeposit} className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">€</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-7 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#8BC34A] transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="bg-[#8BC34A] hover:bg-[#9CCC50] disabled:opacity-50 text-zinc-900 font-semibold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  {depositLoading ? t(lang, 'loading') : t(lang, 'deposit_submit')}
                </button>
              </form>
            </div>
          )}

          {depositSuccess && (
            <div className="flex items-center gap-2 p-3 bg-[#8BC34A]/10 border border-[#8BC34A]/20 rounded-xl text-[#8BC34A] text-sm">
              <CheckCircle size={16} />
              {lang === 'lv' ? 'Maks papildināts!' : 'Кошелёк пополнен!'}
            </div>
          )}

          {/* Transaction history */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">{t(lang, 'profile_transactions')}</h3>
            {transactions.length === 0 ? (
              <p className="text-zinc-500 text-sm">{lang === 'lv' ? 'Nav darījumu' : 'Нет транзакций'}</p>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      {txTypeIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{txTypeLabel(tx.type)}</p>
                      {tx.description && <p className="text-zinc-500 text-xs">{tx.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className={clsx(
                        'font-semibold text-sm',
                        tx.amount > 0 && (tx.type === 'deposit' || tx.type === 'earning') ? 'text-[#8BC34A]' : 'text-red-400'
                      )}>
                        {tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}€{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-zinc-600 text-xs">
                        {new Date(tx.created_at).toLocaleDateString(lang === 'lv' ? 'lv-LV' : 'ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-2xl font-bold text-[#8BC34A]">{profile.rating_avg.toFixed(1)}</p>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={profile.rating_avg >= s ? '#8BC34A' : 'none'} stroke="#8BC34A" strokeWidth="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-500 text-xs">{profile.rating_count} {t(lang, 'reviews')}</p>
            </div>
          </div>
          {profile.rating_count === 0 && (
            <p className="text-zinc-500 text-sm">{lang === 'lv' ? 'Nav atsauksmju' : 'Нет отзывов'}</p>
          )}
        </div>
      )}
    </div>
  )
}

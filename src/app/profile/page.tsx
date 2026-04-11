'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Listing, Review, WalletTransaction } from '@/types';
import ListingCard from '@/components/ListingCard';
import StarRating from '@/components/StarRating';

type Tab = 'listings' | 'reviews' | 'wallet';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { T } = useLang();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    if (profile) {
      setEditName(profile.full_name || '');
      setEditBio(profile.bio || '');
    }
  }, [user, profile, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    async function loadTab() {
      if (tab === 'listings') {
        const { data } = await supabase
          .from('listings')
          .select('*, profiles(*)')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });
        setListings((data as Listing[]) || []);
      } else if (tab === 'reviews') {
        const { data } = await supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviewer_id(*)')
          .eq('reviewed_id', user!.id)
          .order('created_at', { ascending: false });
        setReviews((data as Review[]) || []);
      } else if (tab === 'wallet') {
        const { data } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });
        setTransactions((data as WalletTransaction[]) || []);
      }
      setLoading(false);
    }

    loadTab();
  }, [tab, user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: editName.trim(), bio: editBio.trim() || null })
      .eq('id', user.id);
    await refreshProfile();
    setEditMode(false);
    setSaving(false);
  }

  if (!user || !profile) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'listings', label: T('my_listings') },
    { key: 'reviews', label: T('reviews') },
    { key: 'wallet', label: T('wallet') },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Profile header */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          {!editMode ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] text-2xl font-bold flex-shrink-0">
                {(profile.full_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">
                  {profile.full_name || '—'}
                </h1>
                {profile.bio && (
                  <p className="text-gray-400 text-sm mt-1">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  {profile.rating_count > 0 && (
                    <div className="flex items-center gap-1">
                      <StarRating value={profile.rating_avg} readonly size="sm" />
                      <span className="text-gray-500 text-sm">
                        {profile.rating_avg.toFixed(1)} ({profile.rating_count})
                      </span>
                    </div>
                  )}
                  <div className="text-[#8BC34A] font-medium text-sm">
                    {T('balance')}: {profile.wallet_balance.toFixed(2)}€
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="text-sm text-gray-500 hover:text-white transition-colors px-3 py-1 border border-[#2a2a2a] rounded-lg hover:border-[#8BC34A]/40"
              >
                ✏️ {T('edit')}
              </button>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{T('full_name')}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#8BC34A] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{T('description')}</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#8BC34A] transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#8BC34A] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#9DD45B] disabled:opacity-50 transition-colors"
                >
                  {saving ? T('loading') : T('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="text-gray-500 hover:text-white transition-colors px-4 py-2"
                >
                  {T('cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                tab === key
                  ? 'bg-[#8BC34A] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        ) : tab === 'listings' ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-white">{T('my_listings')}</h2>
              <Link
                href="/listings/create"
                className="text-sm bg-[#8BC34A] text-black font-medium px-4 py-1.5 rounded-lg hover:bg-[#9DD45B] transition-colors"
              >
                + {T('create_listing')}
              </Link>
            </div>
            {listings.length === 0 ? (
              <p className="text-gray-500 text-sm">{T('no_listings')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        ) : tab === 'reviews' ? (
          <div>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm">{T('no_reviews')}</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] text-xs font-bold">
                        {(review.reviewer?.full_name || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-medium">
                        {review.reviewer?.full_name || '—'}
                      </span>
                      <StarRating value={review.rating} readonly size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-gray-400 text-sm">{review.comment}</p>
                    )}
                    <div className="text-gray-600 text-xs mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Wallet tab
          <div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
              <div className="text-gray-400 text-sm mb-1">{T('balance')}</div>
              <div className="text-4xl font-bold text-[#8BC34A]">
                {profile.wallet_balance.toFixed(2)}€
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-[#8BC34A] text-black font-bold py-2.5 rounded-xl hover:bg-[#9DD45B] transition-colors text-sm">
                  + {T('top_up')}
                </button>
                <button className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium py-2.5 rounded-xl hover:border-[#8BC34A]/40 transition-colors text-sm">
                  ↑ {T('withdraw')}
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-white mb-3">{T('transactions')}</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-sm">{T('no_transactions')}</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white text-sm">{tx.description || tx.type}</div>
                      <div className="text-gray-600 text-xs">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`font-bold ${
                        tx.type === 'credit' ? 'text-[#8BC34A]' : 'text-red-400'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(2)}€
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

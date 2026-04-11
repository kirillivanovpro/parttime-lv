'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Listing, CategoryType } from '@/types';
import ListingCard from '@/components/ListingCard';
import CategoryIcon from '@/components/CategoryIcon';
import Logo from '@/components/Logo';
import { TranslationKey } from '@/lib/i18n';

const CATEGORIES: CategoryType[] = [
  'cleaning', 'dog_walking', 'tutoring', 'photo_video', 'delivery', 'repairs',
];

export default function HomePage() {
  const { T } = useLang();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offer' | 'request'>('offer');
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      let query = supabase
        .from('listings')
        .select('*, profiles(*)')
        .eq('is_active', true)
        .eq('type', activeTab)
        .order('created_at', { ascending: false })
        .limit(12);

      if (activeCategory) {
        query = query.eq('category', activeCategory);
      }

      const { data } = await query;
      setListings((data as Listing[]) || []);
      setLoading(false);
    }

    fetchListings();
  }, [activeTab, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8BC34A]/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            {T('tagline')}
          </p>

          {/* Two sections */}
          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
            <button
              onClick={() => setActiveTab('offer')}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                activeTab === 'offer'
                  ? 'border-[#8BC34A] bg-[#8BC34A]/10'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#8BC34A]/40'
              }`}
            >
              <div className="text-3xl mb-2">💪</div>
              <h2 className="font-bold text-white text-lg">{T('i_can_do')}</h2>
              <p className="text-gray-400 text-sm mt-1">{T('i_can_do_desc')}</p>
            </button>

            <button
              onClick={() => setActiveTab('request')}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                activeTab === 'request'
                  ? 'border-[#8BC34A] bg-[#8BC34A]/10'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#8BC34A]/40'
              }`}
            >
              <div className="text-3xl mb-2">🙋</div>
              <h2 className="font-bold text-white text-lg">{T('i_need_help')}</h2>
              <p className="text-gray-400 text-sm mt-1">{T('i_need_help_desc')}</p>
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/listings/create"
            className="inline-flex items-center gap-2 bg-[#8BC34A] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#9DD45B] transition-colors text-lg"
          >
            + {T('create_listing')}
          </Link>
        </div>
      </section>

      {/* Category filter */}
      <section className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-[#8BC34A] text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
            }`}
          >
            {T('all_categories')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#8BC34A] text-black'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
              }`}
            >
              <CategoryIcon category={cat} size="sm" />
              {T(cat as TranslationKey)}
            </button>
          ))}
        </div>
      </section>

      {/* Listings grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold text-white mb-4">
          {T('latest_listings')}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] rounded-xl p-4 h-48 animate-pulse"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p>{T('no_listings')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import CategoryIcon from '@/components/CategoryIcon';
import { CategoryType, ListingType } from '@/types';
import { TranslationKey } from '@/lib/i18n';
import Link from 'next/link';

const CATEGORIES: CategoryType[] = [
  'cleaning', 'dog_walking', 'tutoring', 'photo_video', 'delivery', 'repairs',
];

export default function CreateListingPage() {
  const router = useRouter();
  const { T } = useLang();
  const { user } = useAuth();

  const [type, setType] = useState<ListingType>('offer');
  const [category, setCategory] = useState<CategoryType>('cleaning');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('h');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{T('login')} to continue</p>
          <Link
            href="/auth"
            className="bg-[#8BC34A] text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#9DD45B] transition-colors"
          >
            {T('login')}
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.from('listings').insert({
      user_id: user!.id,
      type,
      category,
      title: title.trim(),
      description: description.trim() || null,
      price: price ? parseFloat(price) : null,
      price_unit: priceUnit,
      location: location.trim() || null,
    }).select().single();

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/listings/${data.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors">
            ← {T('back')}
          </Link>
          <h1 className="text-2xl font-bold text-white">{T('create_new_listing')}</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              {T('listing_type')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['offer', 'request'] as ListingType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    type === t
                      ? 'bg-[#8BC34A] text-black'
                      : 'bg-[#0f0f0f] text-gray-400 border border-[#2a2a2a] hover:border-[#8BC34A]/40'
                  }`}
                >
                  {T(t as TranslationKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              {T('category')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all ${
                    category === cat
                      ? 'bg-[#8BC34A]/20 border-2 border-[#8BC34A] text-[#8BC34A]'
                      : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-400 hover:border-[#8BC34A]/40'
                  }`}
                >
                  <CategoryIcon category={cat} size="md" />
                  <span className="text-xs font-medium">{T(cat as TranslationKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {T('title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
                placeholder={category === 'cleaning' ? 'Mājas uzkopšana Rīgā' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {T('description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors resize-none"
                placeholder=""
              />
            </div>
          </div>

          {/* Price */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              {T('price')}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.50"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-8 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
                  placeholder="10.00"
                />
              </div>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#8BC34A] transition-colors"
              >
                <option value="h">{T('per_hour')}</option>
                <option value="job">{T('per_job')}</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              {T('location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
              placeholder="Rīga, Centrs"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full bg-[#8BC34A] text-black font-bold py-4 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
          >
            {loading ? T('loading') : T('publish')}
          </button>
        </form>
      </div>
    </div>
  );
}

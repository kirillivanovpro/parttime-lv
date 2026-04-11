'use client';

import Link from 'next/link';
import { Listing } from '@/types';
import CategoryIcon from './CategoryIcon';
import StarRating from './StarRating';
import { useLang } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/lib/i18n';

function timeAgo(dateStr: string, T: (k: TranslationKey) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} ${T('days')} ${T('ago')}`;
  if (hours > 0) return `${hours} ${T('hours')} ${T('ago')}`;
  return `${mins} ${T('minutes')} ${T('ago')}`;
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const { T } = useLang();

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#8BC34A]/40 hover:bg-[#1e1e1e] transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CategoryIcon category={listing.category} size="md" />
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#8BC34A]/10 text-[#8BC34A] font-medium">
              {T(listing.category as TranslationKey)}
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              listing.type === 'offer'
                ? 'bg-blue-900/30 text-blue-400'
                : 'bg-purple-900/30 text-purple-400'
            }`}
          >
            {T(listing.type as TranslationKey)}
          </span>
        </div>

        <h3 className="font-semibold text-white group-hover:text-[#8BC34A] transition-colors line-clamp-2 mb-1">
          {listing.title}
        </h3>

        {listing.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {listing.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            {listing.profiles && (
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-xs text-[#8BC34A] font-bold">
                  {(listing.profiles.full_name || '?')[0].toUpperCase()}
                </div>
                <span className="text-gray-400 text-xs">
                  {listing.profiles.full_name || '—'}
                </span>
              </div>
            )}
            {listing.profiles && listing.profiles.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <StarRating
                  value={listing.profiles.rating_avg}
                  readonly
                  size="sm"
                />
                <span className="text-gray-500 text-xs">
                  ({listing.profiles.rating_count})
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            {listing.price != null && (
              <span className="text-[#8BC34A] font-bold">
                {T('eur_per')}{listing.price_unit === 'h' ? T('per_hour') : T('per_job')} {listing.price}€
              </span>
            )}
            <div className="text-gray-600 text-xs mt-0.5">
              {timeAgo(listing.created_at, T)}
            </div>
          </div>
        </div>

        {listing.location && (
          <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
            <span>📍</span>
            <span>{listing.location}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

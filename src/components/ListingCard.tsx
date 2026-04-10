'use client'

import Link from 'next/link'
import { MapPin, MessageCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { ListingWithProfile } from '@/types/database'
import { useApp } from '@/lib/context'
import { t } from '@/lib/i18n'
import { CategoryIcon } from './CategoryIcon'
import { RatingDisplay } from './StarRating'

interface ListingCardProps {
  listing: ListingWithProfile
  onContact?: (listing: ListingWithProfile) => void
}

export function ListingCard({ listing, onContact }: ListingCardProps) {
  const { lang } = useApp()

  const title = lang === 'lv' ? listing.title_lv : listing.title_ru
  const description = lang === 'lv' ? listing.description_lv : listing.description_ru

  const priceUnitMap: Record<string, string> = {
    hour: t(lang, 'per_hour'),
    job: t(lang, 'per_job'),
    day: t(lang, 'per_day'),
  }

  const priceUnit = priceUnitMap[listing.price_unit ?? 'hour'] ?? t(lang, 'per_hour')

  const categoryLabels: Record<string, string> = {
    cleaning: t(lang, 'cat_cleaning'),
    dog_walking: t(lang, 'cat_dog_walking'),
    tutoring: t(lang, 'cat_tutoring'),
    photo_video: t(lang, 'cat_photo_video'),
    delivery: t(lang, 'cat_delivery'),
    repairs: t(lang, 'cat_repairs'),
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-200 group flex flex-col">
      {/* Image or gradient header */}
      <div className="relative h-36 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-700">
            <CategoryIcon category={listing.category} size={40} />
          </div>
        )}
        {/* Type badge */}
        <div className={clsx(
          'absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold',
          listing.type === 'offer'
            ? 'bg-[#8BC34A] text-zinc-900'
            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        )}>
          {listing.type === 'offer' ? t(lang, 'offer_badge') : t(lang, 'request_badge')}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Category & title */}
        <div className="flex items-start gap-2 mb-2">
          <div className="mt-0.5 text-[#8BC34A] flex-shrink-0">
            <CategoryIcon category={listing.category} size={16} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">{categoryLabels[listing.category]}</p>
            <Link href={`/listings/${listing.id}`}>
              <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 hover:text-[#8BC34A] transition-colors">
                {title}
              </h3>
            </Link>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-zinc-400 text-xs line-clamp-2 mb-3 flex-1">{description}</p>
        )}

        {/* Rating */}
        {listing.profiles?.rating_count > 0 && (
          <div className="mb-3">
            <RatingDisplay
              avg={listing.profiles.rating_avg}
              count={listing.profiles.rating_count}
              reviewsLabel={t(lang, 'reviews')}
              reviewSingular={t(lang, 'review_singular')}
            />
          </div>
        )}

        {/* Bottom: price + location + contact */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-zinc-800">
          <div>
            {listing.price ? (
              <span className="text-[#8BC34A] font-bold text-sm">
                €{listing.price}
                <span className="text-zinc-400 font-normal text-xs">{priceUnit}</span>
              </span>
            ) : (
              <span className="text-zinc-500 text-xs">—</span>
            )}
            {listing.location && (
              <div className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5">
                <MapPin size={10} />
                <span>{listing.location}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onContact?.(listing)}
            className="flex items-center gap-1.5 bg-[#8BC34A] hover:bg-[#9CCC50] text-zinc-900 font-semibold text-xs px-3 py-2 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <MessageCircle size={14} />
            {t(lang, 'contact')}
          </button>
        </div>
      </div>
    </div>
  )
}

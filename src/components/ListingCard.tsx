import Link from 'next/link'
import type { Listing, ListingCategory } from '@/lib/types'
import type { T } from '@/lib/i18n'

const CATEGORY_COLORS: Record<ListingCategory, string> = {
  cleaning: 'bg-blue-50 text-blue-700',
  delivery: 'bg-orange-50 text-orange-700',
  it: 'bg-purple-50 text-purple-700',
  garden: 'bg-green-50 text-green-700',
  moving: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-50 text-gray-600',
}

interface ListingCardProps {
  listing: Listing
  t: T
}

export default function ListingCard({ listing, t }: ListingCardProps) {
  const categoryLabel = t.categories[listing.category]
  const colorClass = CATEGORY_COLORS[listing.category]
  const date = new Date(listing.created_at).toLocaleDateString('lv-LV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white border border-gray-100 rounded-xl p-5 hover:border-accent hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
          {categoryLabel}
        </span>
        {listing.price !== null && (
          <span className="text-sm font-bold text-gray-900">
            €{listing.price.toFixed(2)}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-accent transition-colors">
        {listing.title}
      </h3>

      {listing.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {listing.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1">
          {listing.location && (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate max-w-[120px]">{listing.location}</span>
            </>
          )}
        </div>
        <span>{date}</span>
      </div>
    </Link>
  )
}

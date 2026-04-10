'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { clsx } from 'clsx'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const display = hovered || value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={clsx(
            'transition-colors duration-150',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
          )}
        >
          <Star
            size={size}
            className={clsx(
              display >= star ? 'fill-[#8BC34A] text-[#8BC34A]' : 'fill-transparent text-zinc-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}

interface RatingDisplayProps {
  avg: number
  count: number
  reviewsLabel: string
  reviewSingular?: string
}

export function RatingDisplay({ avg, count, reviewsLabel, reviewSingular }: RatingDisplayProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(avg)} readonly size={14} />
      <span className="text-sm text-zinc-400">
        {avg.toFixed(1)} · {count} {count === 1 ? reviewSingular ?? reviewsLabel : reviewsLabel}
      </span>
    </div>
  )
}

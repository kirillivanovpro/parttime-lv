'use client'

import {
  Sparkles,
  Dog,
  GraduationCap,
  Camera,
  Truck,
  Wrench,
  LayoutGrid,
} from 'lucide-react'
import { ListingCategory } from '@/types/database'
import { clsx } from 'clsx'

interface CategoryIconProps {
  category: ListingCategory | 'all'
  className?: string
  size?: number
}

export function CategoryIcon({ category, className, size = 20 }: CategoryIconProps) {
  const icons: Record<string, React.ElementType> = {
    cleaning: Sparkles,
    dog_walking: Dog,
    tutoring: GraduationCap,
    photo_video: Camera,
    delivery: Truck,
    repairs: Wrench,
    all: LayoutGrid,
  }

  const Icon = icons[category] ?? LayoutGrid

  return <Icon size={size} className={className} />
}

interface CategoryBadgeProps {
  category: ListingCategory | 'all'
  label: string
  active?: boolean
  onClick?: () => void
}

export function CategoryBadge({ category, label, active, onClick }: CategoryBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
        active
          ? 'bg-[#8BC34A] text-zinc-900'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
      )}
    >
      <CategoryIcon category={category} size={16} />
      {label}
    </button>
  )
}

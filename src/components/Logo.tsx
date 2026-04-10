'use client'

import Link from 'next/link'
import { clsx } from 'clsx'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <Link href="/" className={clsx('font-bold tracking-tight select-none', sizeClasses[size], className)}>
      <span className="text-white">Part</span>
      <span className="text-[#8BC34A] animate-blink">:</span>
      <span className="text-white">time</span>
      <span className="text-[#8BC34A] text-sm align-super">.lv</span>
    </Link>
  )
}

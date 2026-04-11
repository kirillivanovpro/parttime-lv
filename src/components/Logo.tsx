'use client';

import Link from 'next/link';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <Link href="/" className={`font-bold tracking-tight ${sizeClasses[size]} select-none`}>
      <span className="text-white">Part</span>
      <span className="text-[#8BC34A] animate-blink">:</span>
      <span className="text-white">time</span>
      <span className="text-[#8BC34A]">.lv</span>
    </Link>
  );
}

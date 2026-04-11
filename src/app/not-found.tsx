'use client';

import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import Logo from '@/components/Logo';

export default function NotFound() {
  const { T } = useLang();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <Logo size="lg" />
      <div className="mt-8 text-6xl font-bold text-[#8BC34A]">404</div>
      <p className="text-gray-400 mt-4 mb-8">Page not found</p>
      <Link
        href="/"
        className="bg-[#8BC34A] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#9DD45B] transition-colors"
      >
        ← {T('home')}
      </Link>
    </div>
  );
}

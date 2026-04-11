'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { T } = useLang();
  const pathname = usePathname();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        pathname === href
          ? 'text-[#8BC34A] font-medium'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#1e1e1e]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Logo size="md" />

        <div className="flex items-center gap-5">
          {navLink('/', T('home'))}
          {user && navLink('/chat', T('chat'))}
          {user && navLink('/listings/create', T('create_listing'))}
          {user ? (
            <>
              {navLink('/profile', T('profile'))}
              <button
                onClick={signOut}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {T('logout')}
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="text-sm bg-[#8BC34A] text-black font-semibold px-4 py-1.5 rounded-lg hover:bg-[#9DD45B] transition-colors"
            >
              {T('login')}
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

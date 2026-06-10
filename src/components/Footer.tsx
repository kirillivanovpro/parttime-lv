import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
            Part<span className="animate-blink">:</span>time
            <span className="text-accent">.lv</span>
          </div>
          <nav className="flex items-center gap-5 text-xs text-gray-400">
            <Link href="/listings" className="hover:text-gray-600 transition-colors">
              Sludinājumi
            </Link>
            <Link href="/faq" className="hover:text-gray-600 transition-colors">
              FAQ
            </Link>
            <Link href="/create" className="hover:text-gray-600 transition-colors">
              Publicēt
            </Link>
          </nav>
          <p className="text-xs text-gray-400">© {year} Part:time.lv</p>
        </div>
      </div>
    </footer>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LangProvider } from '@/contexts/LangContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Part:time.lv — Darbu sludinājumi',
  description: 'Ātrākais veids, kā publicēt darba sludinājumu un atrast izpildītāju Latvijā',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv">
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen flex flex-col`}>
        <AuthProvider>
          <LangProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

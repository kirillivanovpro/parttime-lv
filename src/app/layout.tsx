import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { AppProvider } from '@/lib/context'

export const metadata: Metadata = {
  title: 'Part:time.lv — Vietējais darba tirgus',
  description: 'Atrodi palīgu vai piedāvā savus pakalpojumus Latvijā. Найди помощника или предложи свои услуги в Латвии.',
  keywords: ['darbs', 'pakalpojumi', 'Latvija', 'part-time', 'работа', 'услуги'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="lv">
      <body className="antialiased bg-zinc-950 text-zinc-50 min-h-screen font-sans">
        <AppProvider>
          <Navbar />
          <main className="pt-14 md:pt-16 pb-16 md:pb-0 min-h-screen">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}

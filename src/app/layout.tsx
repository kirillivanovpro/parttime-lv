import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Part:time.lv — darbs un pakalpojumi',
  description: 'Atrodi palīgu vai piedāvā savas prasmes Latvijā',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lv">
      <body className="bg-[#0f0f0f] text-white min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="pt-14 min-h-screen">{children}</main>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

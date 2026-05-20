import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: { template: '%s | Panda NG', default: 'Panda NG — Luxury Jackpot Gaming' },
  description: 'AAA cyberpunk panda casino jackpot platform. Spin, win, and rise through the ranks.',
  keywords: ['jackpot', 'casino', 'panda', 'gaming', 'slots', 'cyberpunk'],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Panda NG' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00FFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-deep-black text-panda-white min-h-screen">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}

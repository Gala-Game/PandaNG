import type { Metadata, Viewport } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
});

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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00FFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-body bg-deep-black text-panda-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

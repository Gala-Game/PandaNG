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
  title: { template: '%s | Panda NG Admin', default: 'Panda NG Admin Dashboard' },
  description: 'PandaNG internal operations dashboard',
  robots: 'noindex, nofollow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00FFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className="font-body bg-deep-black text-panda-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

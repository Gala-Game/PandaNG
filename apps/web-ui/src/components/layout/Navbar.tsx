'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useWalletStore, formatPHP } from '@/store/wallet.store';

const NAV_LINKS = [
  { href: '/games', label: 'GAMES' },
  { href: '/jackpots', label: 'JACKPOTS' },
  { href: '/leaderboard', label: 'LEADERBOARD' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { balanceInCents } = useWalletStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const vipColors: Record<string, string> = {
    BRONZE: 'text-orange-400',
    SILVER: 'text-gray-400',
    GOLD: 'text-yellow-400',
    PLATINUM: 'text-cyan-400',
    DIAMOND: 'text-blue-400',
    PANDA_ELITE: 'text-fuchsia-400',
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold">
            <span className="text-2xl">🐼</span>
            <span className="text-neon-cyan">PANDA</span>
            <span className="text-white">NG</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`font-heading text-sm font-semibold tracking-wider transition-colors ${
                  pathname.startsWith(l.href)
                    ? 'text-neon-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Balance chip */}
                <Link
                  href="/wallet"
                  className="hidden rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 font-heading text-sm font-bold text-neon-cyan hover:bg-neon-cyan/20 sm:block"
                >
                  {formatPHP(balanceInCents)}
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                  >
                    <span className="text-lg">🐼</span>
                    <span className="hidden font-heading font-semibold sm:block">{user.username}</span>
                    {user.vipLevel && (
                      <span className={`hidden text-xs font-bold sm:block ${vipColors[user.vipLevel] ?? 'text-gray-400'}`}>
                        {user.vipLevel.replace('_', ' ')}
                      </span>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-xl">
                      <Link href="/wallet" className="block px-4 py-2 text-sm hover:bg-white/10">
                        💰 Wallet
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-white/10">
                        👤 Profile
                      </Link>
                      <hr className="my-1 border-white/10" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/10 sm:block"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-neon-cyan px-3 py-1.5 text-sm font-bold text-black hover:bg-neon-cyan/80"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="p-2 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <div className="flex h-5 w-5 flex-col justify-between">
                <span className="h-0.5 w-full bg-white" />
                <span className="h-0.5 w-full bg-white" />
                <span className="h-0.5 w-full bg-white" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-white/10 py-3 md:hidden">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-2 py-2 font-heading font-semibold tracking-wider text-gray-300 hover:text-neon-cyan"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

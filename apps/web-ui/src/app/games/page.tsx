'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { jackpotApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const GAMES = [
  { slug: 'slots', name: 'Panda Fortune Slots', emoji: '🎰', desc: '5-reel • 20 paylines • 100× jackpot', badge: 'HOT', glow: 'gold' as const },
  { slug: 'crash', name: 'Panda Crash', emoji: '🚀', desc: 'Multiplier crash • Cash out any time', badge: 'LIVE', glow: 'pink' as const },
  { slug: 'dice', name: 'Dragon Dice', emoji: '🎲', desc: 'Over / under • Up to 9900×', badge: null, glow: 'cyan' as const },
  { slug: 'spin-wheel', name: 'Panda Spin Wheel', emoji: '🎡', desc: '9 segments • Up to 100×', badge: null, glow: 'cyan' as const },
  { slug: 'bamboo-blast', name: 'Bamboo Blast', emoji: '💥', desc: 'Instant win slots variant', badge: 'NEW', glow: 'pink' as const },
];

export default function GamesPage() {
  const { data: jackpots } = useQuery({
    queryKey: ['jackpots'],
    queryFn: jackpotApi.getAll,
    refetchInterval: 10_000,
  });

  return (
    <main className="min-h-screen bg-cyber-grid bg-[size:40px_40px] bg-deep-black px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Jackpot ticker */}
        {jackpots && jackpots.length > 0 && (
          <div className="mb-6 flex items-center gap-4 overflow-hidden rounded-xl border border-gold/30 bg-black/60 px-4 py-2">
            <span className="shrink-0 font-heading text-xs font-bold text-gold">JACKPOTS</span>
            <div className="flex gap-6 overflow-x-auto font-heading text-sm">
              {jackpots.map((j: { tier: string; name: string; currentAmountInCents: string }) => (
                <span key={j.tier} className="shrink-0">
                  <span className="text-gray-400">{j.name}: </span>
                  <span className="font-bold text-gold">
                    ₱{(BigInt(j.currentAmountInCents) / 100n).toLocaleString()}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-black text-white md:text-5xl">
            <span className="text-neon-cyan">GAME</span> LOBBY
          </h1>
          <p className="mt-2 text-gray-400">Choose your game and start winning</p>
        </div>

        {/* Game grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <GlassCard glow={game.glow} className="relative overflow-hidden p-6 hover:scale-[1.02] transition-transform">
                {game.badge && (
                  <span className={`absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    game.badge === 'HOT' ? 'bg-orange-500/20 text-orange-400' :
                    game.badge === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                    'bg-neon-cyan/20 text-neon-cyan'
                  }`}>
                    {game.badge}
                  </span>
                )}
                <div className="mb-3 text-4xl">{game.emoji}</div>
                <h3 className="font-heading text-xl font-bold text-white">{game.name}</h3>
                <p className="mt-1 mb-4 text-sm text-gray-400">{game.desc}</p>
                <Link href={`/games/${game.slug}`}>
                  <CyberButton variant={game.glow === 'gold' ? 'gold' : game.glow === 'pink' ? 'danger' : 'primary'} className="w-full">
                    PLAY NOW
                  </CyberButton>
                </Link>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

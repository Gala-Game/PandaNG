'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px]">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="text-8xl">🐼</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="font-heading text-5xl md:text-7xl font-bold mb-4 neon-text-cyan"
        >
          PANDA NG
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl text-panda-white/70 mb-4 max-w-xl"
        >
          Luxury cyberpunk jackpot gaming. Spin the bamboo, claim the gold.
        </motion.p>

        {/* Jackpot Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card px-8 py-4 mb-8 border-neon-cyan/40"
        >
          <p className="text-sm text-neon-cyan/60 font-heading tracking-widest uppercase mb-1">
            Grand Jackpot
          </p>
          <p className="font-heading text-4xl font-bold neon-text-gold animate-neon-pulse">
            ₱12,345,678.90
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/register"
            className="cyber-btn px-8 py-3 rounded-xl bg-neon-cyan text-deep-black font-bold text-lg shadow-neon-cyan hover:shadow-neon-cyan"
          >
            Play Now
          </Link>
          <Link
            href="/games"
            className="cyber-btn px-8 py-3 rounded-xl border border-neon-cyan/50 text-neon-cyan font-bold text-lg hover:border-neon-cyan"
          >
            Browse Games
          </Link>
        </motion.div>
      </section>

      {/* Game Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-heading text-3xl font-bold neon-text-cyan mb-8 text-center">
          FEATURED GAMES
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 hover:border-neon-cyan/40 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-4xl mb-2 group-hover:animate-float">{game.icon}</div>
              <h3 className="font-heading font-bold text-panda-white">{game.name}</h3>
              <p className="text-xs text-neon-cyan/60 mt-1">{game.players.toLocaleString()} playing</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}

const GAMES = [
  { id: 'panda-spin', name: 'Panda Spin', icon: '🎰', players: 4821 },
  { id: 'bamboo-blast', name: 'Bamboo Blast', icon: '💥', players: 2341 },
  { id: 'dragon-dice', name: 'Dragon Dice', icon: '🎲', players: 1892 },
  { id: 'golden-slots', name: 'Golden Slots', icon: '🌟', players: 3210 },
  { id: 'crash', name: 'Crash', icon: '🚀', players: 5670 },
  { id: 'roulette', name: 'Roulette', icon: '🎡', players: 1230 },
  { id: 'scratch', name: 'Lucky Scratch', icon: '🎟️', players: 980 },
  { id: 'mini', name: 'Mini Games', icon: '🕹️', players: 2100 },
] as const;

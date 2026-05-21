import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Game Lobby',
  description: 'Choose from 5 cyberpunk panda casino games. Provably fair, instant payouts.',
};

const GAMES = [
  {
    href: '/games/slots',
    emoji: '🎰',
    name: 'Panda Fortune Slots',
    description: '5-reel, 20-payline. Scatter wilds, free spins, jackpot trigger.',
    color: 'border-neon-cyan/40 hover:border-neon-cyan',
    badge: 'POPULAR',
    badgeColor: 'bg-neon-cyan/20 text-neon-cyan',
    rtp: '96%',
  },
  {
    href: '/games/crash',
    emoji: '🚀',
    name: 'Panda Crash',
    description: 'Real-time multiplier grows until it crashes. Cash out before bust!',
    color: 'border-neon-pink/40 hover:border-neon-pink',
    badge: 'HOT',
    badgeColor: 'bg-neon-pink/20 text-neon-pink',
    rtp: '99%',
  },
  {
    href: '/games/dice',
    emoji: '🎲',
    name: 'Panda Dice',
    description: 'Roll over or under your target. Adjust win chance & payout freely.',
    color: 'border-gold/40 hover:border-gold',
    badge: null,
    badgeColor: '',
    rtp: '99%',
  },
  {
    href: '/games/wheel',
    emoji: '🎡',
    name: 'Panda Spin Wheel',
    description: 'Seven segments, up to 20× multiplier. Pure luck, pure style.',
    color: 'border-neon-green/30 hover:border-neon-green',
    badge: 'NEW',
    badgeColor: 'bg-neon-green/20 text-neon-green',
    rtp: '97%',
  },
  {
    href: '/games/treasure',
    emoji: '🗺️',
    name: 'Panda Treasure Hunt',
    description: '5×4 pick grid — uncover gems, avoid mines, cash out any time.',
    color: 'border-purple-500/40 hover:border-purple-400',
    badge: null,
    badgeColor: '',
    rtp: '97%',
  },
];

export default function GamesLobbyPage() {
  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-heading text-4xl font-bold neon-text-cyan">
            🐼 PANDA GAME LOBBY
          </h1>
          <p className="text-panda-white/50 font-body text-lg">
            All games are provably fair. Every outcome is verifiable on-chain.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((game) => (
            <Link key={game.href} href={game.href} className="group">
              <div
                className={`glass-card p-6 border-2 transition-all duration-200 h-full
                            flex flex-col gap-3 group-hover:-translate-y-1 ${game.color}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{game.emoji}</span>
                  {game.badge && (
                    <span className={`px-2 py-0.5 rounded font-heading text-xs font-bold ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-lg font-bold text-panda-white">
                  {game.name}
                </h2>
                <p className="text-panda-white/50 text-sm font-body flex-1">
                  {game.description}
                </p>
                <div className="flex items-center justify-between text-xs font-heading pt-2 border-t border-dark-border">
                  <span className="text-panda-white/30">RTP</span>
                  <span className="text-neon-cyan/70">{game.rtp}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Provably fair notice */}
        <div className="glass-card p-4 border-neon-cyan/10 text-center">
          <p className="text-panda-white/40 text-sm font-body">
            🔒 All games use{' '}
            <Link href="/verify" className="text-neon-cyan/60 hover:text-neon-cyan underline">
              provably fair RNG
            </Link>
            . Session IDs can be audited after each round.
          </p>
        </div>
      </div>
    </main>
  );
}

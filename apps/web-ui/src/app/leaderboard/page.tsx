import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Top winners, biggest jackpots, and most wagered players on Panda NG.',
};

// Static placeholder — real data would be fetched via API
const MOCK_LEADERS = [
  { rank: 1,  username: 'panda_king',    wins: '₱2,450,000', badge: '🏆' },
  { rank: 2,  username: 'bamboo_lord',   wins: '₱1,890,000', badge: '🥈' },
  { rank: 3,  username: 'moonbear99',    wins: '₱1,230,000', badge: '🥉' },
  { rank: 4,  username: 'crystalpanda',  wins: '₱987,500',   badge: '💎' },
  { rank: 5,  username: 'jade_emperor',  wins: '₱876,200',   badge: '💎' },
  { rank: 6,  username: 'goldtiger88',   wins: '₱654,100',   badge: '🐼' },
  { rank: 7,  username: 'lotusbloom',    wins: '₱543,000',   badge: '🐼' },
  { rank: 8,  username: 'redpanda420',   wins: '₱432,800',   badge: '🐼' },
  { rank: 9,  username: 'zenbamboo',     wins: '₱321,500',   badge: '🐼' },
  { rank: 10, username: 'silkroute',     wins: '₱210,000',   badge: '🐼' },
];

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold neon-text-gold">🏆 LEADERBOARD</h1>
          <p className="text-panda-white/50 text-sm font-body">Top 10 winners — updated daily</p>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2">
          {['Daily', 'Weekly', 'All Time'].map((period, i) => (
            <button
              key={period}
              className={`px-4 py-2 rounded-lg font-heading text-sm transition-colors ${
                i === 2
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-dark-card border border-dark-border text-panda-white/40 hover:text-panda-white/70'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        <div className="glass-card border-dark-border overflow-hidden">
          {MOCK_LEADERS.map((entry, idx) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 px-5 py-4 border-b border-dark-border/50 last:border-0
                          ${idx < 3 ? 'bg-gold/5' : ''} hover:bg-white/3 transition-colors`}
            >
              <div className="w-8 text-center font-heading font-bold text-panda-white/30 text-sm">
                {entry.badge ?? `#${entry.rank}`}
              </div>
              <div className="flex-1">
                <div className="font-heading font-bold text-panda-white">{entry.username}</div>
              </div>
              <div className={`font-heading font-bold ${idx < 3 ? 'neon-text-gold' : 'text-panda-white/70'}`}>
                {entry.wins}
              </div>
            </div>
          ))}
        </div>

        <Link href="/games" className="block text-center text-neon-cyan/50 hover:text-neon-cyan font-heading text-sm">
          ← Back to Games
        </Link>
      </div>
    </main>
  );
}

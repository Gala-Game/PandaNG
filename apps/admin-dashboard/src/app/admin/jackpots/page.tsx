'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJackpots } from '@/lib/api';

interface Jackpot {
  id: string;
  tier: string;
  currentAmountInCents: string;
  seedAmountInCents: string;
  contributionRateBps: number;
  isActive: boolean;
  lastWonAt: string | null;
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'text-amber-500 border-amber-500/30',
  SILVER: 'text-slate-300 border-slate-400/30',
  GOLD:   'neon-text-gold border-gold/30',
  DIAMOND: 'text-neon-cyan border-neon-cyan/30',
};

export default function JackpotsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-jackpots'],
    queryFn: fetchJackpots,
    refetchInterval: 5000,
  });

  const jackpots: Jackpot[] = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-panda-white">Jackpots</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="text-panda-white/30 font-heading text-center py-8 col-span-2">Loading...</div>
        ) : jackpots.length === 0 ? (
          <div className="text-panda-white/30 font-heading text-center py-8 col-span-2">No jackpots found</div>
        ) : (
          jackpots.map((j) => {
            const color = TIER_COLORS[j.tier] ?? 'text-panda-white border-dark-border';
            const colorClass = color.split(' ')[0]!;
            const borderClass = color.split(' ')[1]!;
            return (
              <div key={j.id} className={`glass-card p-6 border-2 ${borderClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h2 className={`font-heading font-bold text-xl ${colorClass}`}>{j.tier}</h2>
                  <span className={`text-xs font-heading px-2 py-0.5 rounded border ${
                    j.isActive ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-panda-white/5 text-panda-white/30 border-panda-white/10'
                  }`}>
                    {j.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div>
                  <div className="text-panda-white/40 text-xs font-heading uppercase tracking-wider mb-1">Current Pool</div>
                  <div className={`font-heading font-bold text-3xl ${colorClass}`}>
                    ₱{(Number(j.currentAmountInCents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-panda-white/30 text-xs font-heading uppercase tracking-wider">Seed Amount</div>
                    <div className="font-heading text-panda-white/70">
                      ₱{(Number(j.seedAmountInCents) / 100).toLocaleString('en-PH')}
                    </div>
                  </div>
                  <div>
                    <div className="text-panda-white/30 text-xs font-heading uppercase tracking-wider">Contribution</div>
                    <div className="font-heading text-panda-white/70">{j.contributionRateBps / 100}%</div>
                  </div>
                </div>

                {j.lastWonAt && (
                  <div className="text-panda-white/30 text-xs font-heading">
                    Last won: {new Date(j.lastWonAt).toLocaleString()}
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="admin-btn flex-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20">
                    Edit Config
                  </button>
                  <button className="admin-btn flex-1 bg-dark-card border border-dark-border text-panda-white/60 hover:border-neon-pink/20 hover:text-neon-pink">
                    Reset Pool
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Overview' };

const STAT_CARDS = [
  { label: 'Daily Active Users',   value: '1,247', delta: '+12%', icon: '👥', color: 'text-neon-cyan' },
  { label: 'Total GGR (24h)',      value: '₱892,500', delta: '+8%', icon: '💰', color: 'neon-text-gold' },
  { label: 'Active Sessions',      value: '83', delta: '+5', icon: '🎮', color: 'text-neon-green' },
  { label: 'Pending Withdrawals',  value: '24', delta: null, icon: '💸', color: 'text-neon-pink' },
];

const JACKPOT_TIERS = [
  { tier: 'BRONZE',   amount: '₱28,450',    color: 'text-amber-500'  },
  { tier: 'SILVER',   amount: '₱156,200',   color: 'text-slate-300'  },
  { tier: 'GOLD',     amount: '₱1,234,000', color: 'neon-text-gold'  },
  { tier: 'DIAMOND',  amount: '₱8,765,000', color: 'text-neon-cyan'  },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-panda-white">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="glass-card p-5 space-y-2 border-dark-border">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              {card.delta && (
                <span className="text-neon-green/70 text-xs font-heading">{card.delta}</span>
              )}
            </div>
            <div className={`font-heading font-bold text-2xl ${card.color}`}>{card.value}</div>
            <div className="text-panda-white/40 text-xs font-heading uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Jackpot levels */}
      <div className="glass-card p-5 border-dark-border">
        <h2 className="font-heading font-bold text-panda-white mb-4">Live Jackpot Levels</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {JACKPOT_TIERS.map((j) => (
            <div key={j.tier} className="bg-dark-card/60 rounded-xl p-4 text-center">
              <div className="text-panda-white/40 text-xs font-heading uppercase tracking-wider mb-1">{j.tier}</div>
              <div className={`font-heading font-bold text-xl ${j.color}`}>{j.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="glass-card p-5 border-dark-border">
        <h2 className="font-heading font-bold text-panda-white mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {[
            { msg: 'User bamboo_lord won ₱45,000 on Panda Fortune Slots', time: '2m ago', type: 'win' },
            { msg: 'Withdrawal request ₱12,000 from user moon99 — pending review', time: '5m ago', type: 'withdrawal' },
            { msg: 'Fraud signal flagged: HIGH_VELOCITY for user test_acc_42', time: '12m ago', type: 'fraud' },
            { msg: 'Jackpot GOLD triggered — ₱1,200,000 won by panda_king', time: '1h ago', type: 'jackpot' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-dark-border/40 last:border-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                item.type === 'fraud' ? 'bg-neon-pink' :
                item.type === 'jackpot' ? 'bg-gold' :
                item.type === 'win' ? 'bg-neon-green' : 'bg-neon-cyan'
              }`} />
              <span className="text-panda-white/70 text-sm font-body flex-1">{item.msg}</span>
              <span className="text-panda-white/30 text-xs font-heading shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

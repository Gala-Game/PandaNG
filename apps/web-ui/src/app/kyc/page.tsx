import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KYC Verification',
  description: 'Verify your identity to unlock full deposit and withdrawal capabilities.',
};

const KYC_TIERS = [
  { tier: 'Tier 0', limit: 'Up to ₱5,000 deposits', badge: '🔓', active: true },
  { tier: 'Tier 1', limit: 'Up to ₱50,000 deposits', badge: '📧', active: false },
  { tier: 'Tier 2', limit: 'Up to ₱500,000 deposits', badge: '🪪', active: false },
  { tier: 'Tier 3', limit: 'Unlimited + Withdrawals > ₱50,000', badge: '🤳', active: false },
];

export default function KYCPage() {
  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-panda-white">
            🪪 Identity Verification
          </h1>
          <p className="text-panda-white/50 text-sm font-body">
            Complete KYC to unlock higher limits. PAGCOR compliance required for large transactions.
          </p>
        </div>

        {/* KYC tiers */}
        <div className="space-y-3">
          {KYC_TIERS.map((t) => (
            <div
              key={t.tier}
              className={`glass-card p-5 border flex items-center justify-between gap-4 ${
                t.active ? 'border-neon-cyan/30' : 'border-dark-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{t.badge}</span>
                <div>
                  <h2 className="font-heading font-bold text-panda-white">{t.tier}</h2>
                  <p className="text-panda-white/50 text-sm font-body">{t.limit}</p>
                </div>
              </div>
              {t.active ? (
                <span className="px-3 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan font-heading text-xs font-bold border border-neon-cyan/30">
                  CURRENT
                </span>
              ) : (
                <button className="px-4 py-1.5 rounded-lg border border-neon-cyan/20 text-neon-cyan/60 font-heading text-sm hover:border-neon-cyan/40 transition-colors">
                  Verify
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Upload form (Tier 1) */}
        <div className="glass-card p-6 border-neon-cyan/20 space-y-5">
          <h2 className="font-heading text-xl font-bold text-panda-white">
            Step 1 — Email Verification
          </h2>
          <p className="text-panda-white/50 text-sm font-body">
            A verification link will be sent to your registered email address.
          </p>
          <button className="w-full py-3 rounded-xl bg-neon-cyan text-deep-black font-heading font-bold
                             shadow-neon-cyan hover:opacity-90 transition-opacity">
            Send Verification Email
          </button>
        </div>

        <div className="glass-card p-5 border-dark-border">
          <h2 className="font-heading font-bold text-panda-white mb-2">PAGCOR Compliance</h2>
          <p className="text-panda-white/50 text-sm font-body">
            Under Philippine law, KYC is mandatory for withdrawals exceeding ₱50,000 and
            AML reporting is required for cumulative deposits over ₱500,000. Your data is
            stored securely and never shared with third parties beyond legal obligations.
          </p>
        </div>
      </div>
    </main>
  );
}

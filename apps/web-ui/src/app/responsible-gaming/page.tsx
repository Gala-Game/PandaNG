import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Responsible Gaming',
  description: 'Set deposit limits, take breaks, and self-exclude. Your well-being matters.',
};

export default function ResponsibleGamingPage() {
  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-panda-white">
            🛡️ Responsible Gaming
          </h1>
          <p className="text-panda-white/50 text-sm font-body">
            Panda NG is committed to safe and responsible gaming.
          </p>
        </div>

        {/* Tools */}
        <div className="space-y-4">
          {[
            {
              title: 'Deposit Limits',
              icon: '💳',
              description: 'Set daily, weekly, or monthly deposit limits to stay in control.',
              action: 'Set Limit',
              color: 'border-neon-cyan/30',
            },
            {
              title: 'Session Time Reminder',
              icon: '⏰',
              description: 'Receive a notification when you have been playing for a set duration.',
              action: 'Configure',
              color: 'border-gold/30',
            },
            {
              title: 'Cooling-Off Period',
              icon: '❄️',
              description: 'Take a break from 24 hours to 30 days. Login will be blocked during this time.',
              action: 'Take a Break',
              color: 'border-neon-pink/30',
            },
            {
              title: 'Self-Exclusion',
              icon: '🚫',
              description: 'Permanently exclude yourself from the platform. This action cannot be undone for a minimum of 6 months.',
              action: 'Self-Exclude',
              color: 'border-neon-pink/50',
              danger: true,
            },
          ].map((tool) => (
            <div key={tool.title} className={`glass-card p-5 border ${tool.color} flex items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{tool.icon}</span>
                <div>
                  <h2 className={`font-heading font-bold ${tool.danger ? 'text-neon-pink' : 'text-panda-white'}`}>
                    {tool.title}
                  </h2>
                  <p className="text-panda-white/50 text-sm font-body mt-1">{tool.description}</p>
                </div>
              </div>
              <button
                className={`shrink-0 px-4 py-2 rounded-lg font-heading font-bold text-sm border transition-colors ${
                  tool.danger
                    ? 'border-neon-pink text-neon-pink hover:bg-neon-pink/10'
                    : 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10'
                }`}
              >
                {tool.action}
              </button>
            </div>
          ))}
        </div>

        {/* Help resources */}
        <div className="glass-card p-5 border-dark-border">
          <h2 className="font-heading font-bold text-panda-white mb-3">Help & Support</h2>
          <div className="space-y-2 text-sm font-body text-panda-white/60">
            <p>If you or someone you know may have a gambling problem, help is available 24/7:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>NCPG Hotline: <span className="text-neon-cyan">1-800-522-4700</span></li>
              <li>Gamblers Anonymous: <span className="text-neon-cyan">www.gamblersanonymous.org</span></li>
              <li>BeGambleAware: <span className="text-neon-cyan">www.begambleaware.org</span></li>
            </ul>
          </div>
        </div>

        <Link href="/games" className="block text-center text-neon-cyan/50 hover:text-neon-cyan font-heading text-sm">
          ← Back to Games
        </Link>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Audit Log' };

const MOCK_AUDIT_ENTRIES = [
  { actor: 'admin@pandang.com', action: 'BAN_USER', target: 'user:test_acc_42', timestamp: '2026-05-12T18:00:00Z' },
  { actor: 'admin@pandang.com', action: 'APPROVE_WITHDRAWAL', target: 'withdrawal:abc123', timestamp: '2026-05-12T17:45:00Z' },
  { actor: 'system', action: 'JACKPOT_TRIGGER', target: 'jackpot:GOLD', timestamp: '2026-05-12T16:30:00Z' },
  { actor: 'admin@pandang.com', action: 'UPDATE_LIVEOPS', target: 'config:maintenance_mode', timestamp: '2026-05-12T15:00:00Z' },
  { actor: 'system', action: 'FRAUD_SIGNAL_FLAGGED', target: 'user:suspicious99', timestamp: '2026-05-12T14:15:00Z' },
];

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-panda-white">Audit Log</h1>
      <p className="text-panda-white/40 text-sm font-body">
        Immutable event feed. All admin actions are logged and cannot be deleted.
      </p>

      <div className="glass-card border-dark-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              {['Timestamp', 'Actor', 'Action', 'Target'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-heading text-xs text-panda-white/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_AUDIT_ENTRIES.map((entry, i) => (
              <tr key={i} className="border-b border-dark-border/30 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 text-panda-white/40 text-xs font-mono">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-neon-cyan/70 text-sm font-heading">{entry.actor}</td>
                <td className="px-4 py-3">
                  <span className="font-heading font-bold text-panda-white text-sm">{entry.action}</span>
                </td>
                <td className="px-4 py-3 text-panda-white/50 text-xs font-mono">{entry.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

// TODO: Replace with real API data from admin-api GET /fraud/signals
const MOCK_SIGNALS = [
  { id: 'fs001', type: 'VELOCITY_ABUSE', severity: 'HIGH', user: 'suspicious_x1', timestamp: '2024-06-10 14:32', resolved: false, notes: '' },
  { id: 'fs002', type: 'MULTI_ACCOUNT', severity: 'CRITICAL', user: 'dual_player99', timestamp: '2024-06-10 13:15', resolved: false, notes: '' },
  { id: 'fs003', type: 'BONUS_ABUSE', severity: 'MEDIUM', user: 'promo_hunter7', timestamp: '2024-06-10 11:40', resolved: false, notes: '' },
  { id: 'fs004', type: 'UNUSUAL_WIN_PATTERN', severity: 'LOW', user: 'lucky_streak22', timestamp: '2024-06-09 22:10', resolved: true, notes: 'Investigated, legitimate wins' },
  { id: 'fs005', type: 'CHARGEBACK_RISK', severity: 'HIGH', user: 'refund_master', timestamp: '2024-06-09 18:55', resolved: false, notes: '' },
  { id: 'fs006', type: 'BOT_DETECTION', severity: 'CRITICAL', user: 'auto_player_x', timestamp: '2024-06-09 16:30', resolved: true, notes: 'Banned, confirmed bot activity' },
  { id: 'fs007', type: 'GEO_MISMATCH', severity: 'MEDIUM', user: 'vpn_user_01', timestamp: '2024-06-09 14:00', resolved: false, notes: '' },
];

const severityStyle: Record<string, string> = {
  LOW: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  MEDIUM: 'bg-gold/10 text-gold border-gold/30',
  HIGH: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
  CRITICAL: 'bg-neon-red/10 text-neon-red border-neon-red/30',
};

interface Signal {
  id: string;
  type: string;
  severity: string;
  user: string;
  timestamp: string;
  resolved: boolean;
  notes: string;
}

export default function FraudPage() {
  const [signals, setSignals] = useState<Signal[]>(MOCK_SIGNALS);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterResolved, setFilterResolved] = useState('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const filtered = signals.filter((s) => {
    const matchSev = filterSeverity === 'ALL' || s.severity === filterSeverity;
    const matchRes = filterResolved === 'ALL' || (filterResolved === 'OPEN' ? !s.resolved : s.resolved);
    return matchSev && matchRes;
  });

  function resolveSignal(id: string) {
    // TODO: wire up to admin-api POST /fraud/signals/:id/resolve
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, resolved: true, notes: resolveNotes } : s)),
    );
    setResolvingId(null);
    setResolveNotes('');
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-panda-white">Fraud Signals</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 outline-none">
          <option value="ALL">All Severities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterResolved} onChange={(e) => setFilterResolved(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 outline-none">
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <span className="text-xs text-gray-500 self-center">{filtered.length} signals</span>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-dark-border text-left">
                {['Type', 'Severity', 'User', 'Timestamp', 'Status', 'Notes', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className={clsx('border-b border-dark-border/50 hover:bg-neon-orange/5 transition-colors', s.resolved && 'opacity-50')}>
                  <td className="px-4 py-3 text-panda-white font-mono text-xs">{s.type}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('px-2 py-0.5 rounded border text-xs font-bold', severityStyle[s.severity])}>
                      {s.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neon-cyan">{s.user}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs', s.resolved ? 'text-neon-green' : 'text-neon-orange')}>
                      {s.resolved ? '✓ Resolved' : '● Open'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">{s.notes || '—'}</td>
                  <td className="px-4 py-3">
                    {!s.resolved && (
                      <button onClick={() => { setResolvingId(s.id); setResolveNotes(''); }}
                        className="text-xs text-neon-green hover:underline">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve modal */}
      {resolvingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-neon-green/30 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-heading text-lg font-bold text-neon-green">Resolve Signal</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Resolution Notes</label>
              <textarea
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe resolution action taken…"
                className="w-full bg-deep-black border border-dark-border rounded px-3 py-2 text-sm text-panda-white outline-none focus:border-neon-green/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => resolveSignal(resolvingId)} className="flex-1 py-2 rounded bg-neon-green text-deep-black text-sm font-semibold hover:bg-neon-green/90 transition-colors">
                Mark Resolved
              </button>
              <button onClick={() => setResolvingId(null)} className="flex-1 py-2 rounded border border-dark-border text-gray-400 text-sm hover:border-gray-500 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

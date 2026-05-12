'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

// TODO: Replace with real API data from game-engine GET /jackpots
const INITIAL_JACKPOTS = [
  { tier: 'MINI', currentAmount: 1247.50, contributionRate: 0.001, winThreshold: 2000, lastWon: '2024-06-08' },
  { tier: 'MINOR', currentAmount: 8940.00, contributionRate: 0.002, winThreshold: 15000, lastWon: '2024-05-22' },
  { tier: 'MAJOR', currentAmount: 42180.75, contributionRate: 0.005, winThreshold: 100000, lastWon: '2024-03-11' },
  { tier: 'GRAND', currentAmount: 128450.00, contributionRate: 0.01, winThreshold: 500000, lastWon: '2023-12-31' },
];

const tierColor: Record<string, string> = {
  MINI: 'text-neon-cyan border-neon-cyan/30',
  MINOR: 'text-neon-green border-neon-green/30',
  MAJOR: 'text-gold border-gold/30',
  GRAND: 'text-neon-orange border-neon-orange/30',
};

interface Jackpot {
  tier: string;
  currentAmount: number;
  contributionRate: number;
  winThreshold: number;
  lastWon: string;
}

export default function JackpotsPage() {
  const [jackpots, setJackpots] = useState<Jackpot[]>(INITIAL_JACKPOTS);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ contributionRate: '', winThreshold: '' });
  const [triggerConfirm, setTriggerConfirm] = useState<string | null>(null);

  function startEdit(j: Jackpot) {
    setEditingTier(j.tier);
    setEditValues({ contributionRate: String(j.contributionRate), winThreshold: String(j.winThreshold) });
  }

  function saveEdit(tier: string) {
    // TODO: wire up to game-engine PATCH /jackpots/:tier/rates
    setJackpots((prev) =>
      prev.map((j) =>
        j.tier === tier
          ? { ...j, contributionRate: parseFloat(editValues.contributionRate), winThreshold: parseFloat(editValues.winThreshold) }
          : j,
      ),
    );
    setEditingTier(null);
  }

  function handleTrigger(tier: string) {
    // TODO: wire up to game-engine POST /jackpots/:tier/trigger
    setJackpots((prev) =>
      prev.map((j) => (j.tier === tier ? { ...j, currentAmount: 0 } : j)),
    );
    setTriggerConfirm(null);
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-panda-white">Jackpot Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jackpots.map((j) => {
          const progress = Math.min((j.currentAmount / j.winThreshold) * 100, 100);
          const isEditing = editingTier === j.tier;

          return (
            <div key={j.tier} className={clsx('bg-dark-card border rounded-xl p-6', tierColor[j.tier] ?? 'border-dark-border')}>
              <div className="flex items-center justify-between mb-4">
                <span className={clsx('font-heading text-xl font-bold', (tierColor[j.tier] ?? '').split(' ')[0])}>
                  {j.tier} JACKPOT
                </span>
                <span className={clsx('text-2xl font-heading font-bold', (tierColor[j.tier] ?? '').split(' ')[0])}>
                  ${j.currentAmount.toLocaleString()}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to win threshold</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-orange rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">Threshold: ${j.winThreshold.toLocaleString()}</div>
              </div>

              {isEditing ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Contribution Rate</label>
                    <input
                      type="number" step="0.0001" min="0" max="0.1"
                      value={editValues.contributionRate}
                      onChange={(e) => setEditValues((v) => ({ ...v, contributionRate: e.target.value }))}
                      className="w-full bg-deep-black border border-dark-border rounded px-3 py-1.5 text-sm text-panda-white outline-none focus:border-neon-orange/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Win Threshold ($)</label>
                    <input
                      type="number"
                      value={editValues.winThreshold}
                      onChange={(e) => setEditValues((v) => ({ ...v, winThreshold: e.target.value }))}
                      className="w-full bg-deep-black border border-dark-border rounded px-3 py-1.5 text-sm text-panda-white outline-none focus:border-neon-orange/60"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(j.tier)} className="flex-1 py-1.5 rounded bg-neon-orange text-deep-black text-xs font-semibold hover:bg-neon-orange/90 transition-colors">Save</button>
                    <button onClick={() => setEditingTier(null)} className="flex-1 py-1.5 rounded border border-dark-border text-gray-400 text-xs hover:border-neon-orange/40 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-4">
                  Contribution rate: <span className="text-gray-300">{(j.contributionRate * 100).toFixed(2)}%</span>
                  <span className="mx-2">·</span>Last won: <span className="text-gray-300">{j.lastWon}</span>
                </div>
              )}

              {!isEditing && (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(j)} className="flex-1 py-2 rounded border border-dark-border text-gray-300 text-xs hover:border-neon-orange/40 hover:text-neon-orange transition-colors">
                    Edit Rates
                  </button>
                  <button onClick={() => setTriggerConfirm(j.tier)} className="flex-1 py-2 rounded bg-neon-red/10 border border-neon-red/30 text-neon-red text-xs hover:bg-neon-red/20 transition-colors">
                    Trigger Win
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trigger confirmation modal */}
      {triggerConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-neon-red/30 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-heading text-lg font-bold text-neon-red mb-2">Confirm Trigger</h3>
            <p className="text-sm text-gray-400 font-body mb-6">
              Are you sure you want to trigger the <span className="text-neon-orange font-semibold">{triggerConfirm}</span> jackpot win? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleTrigger(triggerConfirm)} className="flex-1 py-2 rounded bg-neon-red text-white text-sm font-semibold hover:bg-neon-red/90 transition-colors">
                Confirm Trigger
              </button>
              <button onClick={() => setTriggerConfirm(null)} className="flex-1 py-2 rounded border border-dark-border text-gray-400 text-sm hover:border-gray-500 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

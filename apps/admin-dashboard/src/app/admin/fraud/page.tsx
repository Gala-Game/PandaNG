'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFraudSignals, resolveFraudSignal } from '@/lib/api';

interface FraudSignal {
  id: string;
  userId: string;
  type: string;
  severity: string;
  score: number;
  description: string;
  isResolved: boolean;
  createdAt: string;
  user: { username: string; email: string };
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW:      'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
  MEDIUM:   'bg-gold/10 text-gold border-gold/20',
  HIGH:     'bg-neon-pink/10 text-neon-pink border-neon-pink/20',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function FraudPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fraud', page, showResolved],
    queryFn: () => fetchFraudSignals(page, 20, showResolved),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => resolveFraudSignal(id, notes),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-fraud'] }),
  });

  const signals: FraudSignal[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-panda-white">Fraud Signals</h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => { setShowResolved(e.target.checked); setPage(1); }}
            className="accent-neon-cyan"
          />
          <span className="text-panda-white/50 font-heading text-sm">Show resolved</span>
        </label>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-panda-white/30 font-heading">Loading...</div>
        ) : signals.length === 0 ? (
          <div className="glass-card p-8 text-center border-dark-border">
            <div className="text-4xl mb-2">🛡️</div>
            <div className="font-heading text-panda-white/50">No fraud signals found</div>
          </div>
        ) : (
          signals.map((sig) => (
            <div key={sig.id} className={`glass-card p-4 border ${sig.isResolved ? 'border-dark-border opacity-60' : 'border-neon-pink/20'} space-y-2`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded border font-heading text-xs font-bold ${SEVERITY_COLORS[sig.severity] ?? ''}`}>
                    {sig.severity}
                  </span>
                  <span className="font-heading font-bold text-panda-white text-sm">{sig.type}</span>
                  <span className="text-panda-white/40 text-xs font-heading">({sig.user.username})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-neon-pink text-sm">Score: {sig.score}</span>
                  {!sig.isResolved && (
                    <button
                      onClick={() => resolveMutation.mutate({ id: sig.id })}
                      disabled={resolveMutation.isPending}
                      className="admin-btn bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 text-xs"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              <p className="text-panda-white/60 text-sm font-body">{sig.description}</p>
              <div className="text-panda-white/30 text-xs font-heading">{new Date(sig.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="admin-btn bg-dark-card border border-dark-border text-panda-white/60 disabled:opacity-30">
            ← Prev
          </button>
          <span className="text-panda-white/40 font-heading text-sm self-center">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}
            className="admin-btn bg-dark-card border border-dark-border text-panda-white/60 disabled:opacity-30">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

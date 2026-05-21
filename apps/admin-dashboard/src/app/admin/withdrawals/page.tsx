'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from '@/lib/api';

interface Withdrawal {
  id: string;
  userId: string;
  amountInCents: string;
  status: string;
  provider: string;
  reference: string;
  createdAt: string;
  user: { username: string; email: string; kycStatus: string };
}

export default function WithdrawalsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', page],
    queryFn: () => fetchPendingWithdrawals(page, 20),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => approveWithdrawal(id, notes),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-withdrawals'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectWithdrawal(id, reason),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-withdrawals'] }),
  });

  const withdrawals: Withdrawal[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-panda-white">Pending Withdrawals</h1>
        <span className="px-3 py-1 rounded-lg bg-neon-pink/10 text-neon-pink font-heading text-sm border border-neon-pink/20">
          {total} pending
        </span>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-panda-white/30 font-heading">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="glass-card p-8 text-center border-dark-border">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-heading text-panda-white/50">No pending withdrawals</div>
          </div>
        ) : (
          withdrawals.map((w) => (
            <div key={w.id} className="glass-card p-5 border-dark-border space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-panda-white">{w.user.username}</span>
                    <span className={`text-xs font-heading px-2 py-0.5 rounded ${
                      w.user.kycStatus === 'VERIFIED' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-pink/10 text-neon-pink'
                    }`}>
                      KYC: {w.user.kycStatus}
                    </span>
                  </div>
                  <div className="text-panda-white/50 text-sm font-body">{w.user.email}</div>
                  <div className="text-panda-white/30 text-xs font-heading">
                    via {w.provider} · {new Date(w.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold text-xl neon-text-gold">
                    ₱{(Number(w.amountInCents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-panda-white/30 text-xs font-heading mt-0.5">{w.reference}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={notesMap[w.id] ?? ''}
                  onChange={(e) => setNotesMap((prev) => ({ ...prev, [w.id]: e.target.value }))}
                  className="flex-1 bg-deep-black/60 border border-dark-border rounded-lg px-3 py-2
                             text-panda-white text-sm font-body focus:border-neon-cyan/30 focus:outline-none"
                />
                <button
                  onClick={() => approveMutation.mutate({ id: w.id, notes: notesMap[w.id] })}
                  disabled={approveMutation.isPending}
                  className="admin-btn bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 whitespace-nowrap"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => rejectMutation.mutate({ id: w.id, reason: notesMap[w.id] ?? 'Rejected by admin' })}
                  disabled={rejectMutation.isPending}
                  className="admin-btn bg-neon-pink/10 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/20 whitespace-nowrap"
                >
                  ✗ Reject
                </button>
              </div>
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

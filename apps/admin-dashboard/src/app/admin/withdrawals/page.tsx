'use client';

import { useState } from 'react';

interface Withdrawal {
  id: string;
  username: string;
  amountInCents: number;
  provider: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  fraudScore: number;
  accountDetails: string;
  requestedAt: string;
}

const MOCK: Withdrawal[] = [
  { id: 'W001', username: 'lucky_panda',   amountInCents: 1500000, provider: 'GCash',  status: 'PENDING',      fraudScore: 12,  accountDetails: '09***4567', requestedAt: '2026-05-12T07:00:00Z' },
  { id: 'W002', username: 'bamboo_king',   amountInCents: 5000000, provider: 'Maya',   status: 'UNDER_REVIEW', fraudScore: 68,  accountDetails: '09***9012', requestedAt: '2026-05-12T06:30:00Z' },
  { id: 'W003', username: 'panda_rush',    amountInCents: 250000,  provider: 'GCash',  status: 'APPROVED',     fraudScore: 5,   accountDetails: '09***3456', requestedAt: '2026-05-11T22:00:00Z' },
  { id: 'W004', username: 'neon_roller',   amountInCents: 10000000,provider: 'BDO',    status: 'UNDER_REVIEW', fraudScore: 85,  accountDetails: '012***789', requestedAt: '2026-05-11T20:00:00Z' },
  { id: 'W005', username: 'crystal_bet',  amountInCents: 750000,  provider: 'Stripe', status: 'COMPLETED',    fraudScore: 8,   accountDetails: 'Visa****1234', requestedAt: '2026-05-10T15:00:00Z' },
  { id: 'W006', username: 'red_panda_77', amountInCents: 300000,  provider: 'GCash',  status: 'REJECTED',     fraudScore: 91,  accountDetails: '09***0000', requestedAt: '2026-05-10T10:00:00Z' },
  { id: 'W007', username: 'jackpot_god',  amountInCents: 20000000,provider: 'BPI',    status: 'PENDING',      fraudScore: 22,  accountDetails: '012***456', requestedAt: '2026-05-12T08:00:00Z' },
  { id: 'W008', username: 'spinning_leo', amountInCents: 500000,  provider: 'Maya',   status: 'APPROVED',     fraudScore: 3,   accountDetails: '09***7890', requestedAt: '2026-05-09T18:00:00Z' },
];

const STATUS_STYLES: Record<Withdrawal['status'], string> = {
  PENDING:      'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  UNDER_REVIEW: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  APPROVED:     'bg-green-500/20 text-green-300 border-green-500/30',
  REJECTED:     'bg-red-500/20 text-red-300 border-red-500/30',
  COMPLETED:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

function fraudBadge(score: number) {
  if (score < 30) return <span className="text-green-400 text-xs">{score}</span>;
  if (score < 60) return <span className="text-yellow-400 text-xs">{score}</span>;
  return <span className="text-red-400 text-xs font-bold">{score} ⚠️</span>;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState(MOCK);
  const [filter, setFilter] = useState<Withdrawal['status'] | 'ALL'>('ALL');
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [note, setNote] = useState('');

  const filtered = filter === 'ALL' ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const handleAction = () => {
    if (!confirmModal) return;
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === confirmModal.id
          ? { ...w, status: confirmModal.action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
          : w,
      ),
    );
    setConfirmModal(null);
    setNote('');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-black text-white">Withdrawals</h1>
          <p className="mt-1 text-sm text-gray-400">Review and process withdrawal requests</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === s
                ? 'bg-orange-500 text-white'
                : 'border border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-gray-500">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Provider</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Fraud Score</th>
              <th className="px-4 py-3 text-left">Requested</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium">{w.username}</td>
                <td className="px-4 py-3 font-heading font-bold text-white">
                  ₱{(w.amountInCents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-gray-300">{w.provider}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{w.accountDetails}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[w.status]}`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3">{fraudBadge(w.fraudScore)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(w.requestedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {(w.status === 'PENDING' || w.status === 'UNDER_REVIEW') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmModal({ id: w.id, action: 'APPROVE' })}
                        className="rounded bg-green-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirmModal({ id: w.id, action: 'REJECT' })}
                        className="rounded bg-red-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-gray-900 p-6">
            <h2 className="mb-2 font-heading text-xl font-bold">
              {confirmModal.action === 'APPROVE' ? '✅ Approve Withdrawal' : '❌ Reject Withdrawal'}
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              {confirmModal.action === 'APPROVE'
                ? 'This will approve the withdrawal and initiate the payout.'
                : 'This will reject the withdrawal and return funds to the user wallet.'}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={handleAction}
                className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                  confirmModal.action === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-500'
                    : 'bg-red-700 hover:bg-red-600'
                } text-white`}
              >
                Confirm {confirmModal.action}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

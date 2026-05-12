'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useWalletStore, formatPHP } from '@/store/wallet.store';
import { walletApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberButton } from '@/components/ui/CyberButton';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: string;
  amountInCents: string;
  balanceAfterInCents: string;
  createdAt: string;
  description?: string;
}

const TYPE_COLORS: Record<string, string> = {
  DEPOSIT: 'text-green-400',
  WIN: 'text-gold',
  BONUS: 'text-blue-400',
  WITHDRAWAL: 'text-red-400',
  BET: 'text-orange-400',
  REFUND: 'text-cyan-400',
};

export default function WalletPage() {
  const { isAuthenticated } = useAuthStore();
  const { balanceInCents, bonusBalanceInCents, fetchBalance } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [depositModal, setDepositModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchBalance();
      void loadTransactions(1);
    }
  }, [isAuthenticated]);

  const loadTransactions = async (p: number) => {
    setLoading(true);
    try {
      const data = await walletApi.getTransactions(p, 20);
      setTransactions(data.data ?? data);
      setTotalPages(data.totalPages ?? 1);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <GlassCard className="p-8 text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">LOGIN TO VIEW WALLET</h2>
          <Link href="/login"><CyberButton variant="primary">Login</CyberButton></Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-deep-black px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-heading text-4xl font-black text-neon-cyan">💰 WALLET</h1>

        {/* Balance cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <GlassCard glow="cyan" className="p-6">
            <div className="text-xs uppercase tracking-wider text-gray-400">Main Balance</div>
            <div className="mt-2 font-heading text-3xl font-black text-neon-cyan">
              {formatPHP(balanceInCents)}
            </div>
          </GlassCard>
          <GlassCard glow="pink" className="p-6">
            <div className="text-xs uppercase tracking-wider text-gray-400">Bonus Balance</div>
            <div className="mt-2 font-heading text-3xl font-black text-neon-pink">
              {formatPHP(bonusBalanceInCents)}
            </div>
          </GlassCard>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <CyberButton variant="primary" onClick={() => setDepositModal(true)}>
            ➕ Deposit
          </CyberButton>
          <CyberButton variant="secondary">
            ➖ Withdraw
          </CyberButton>
        </div>

        {/* Transaction history */}
        <GlassCard className="overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3 font-heading text-sm font-bold text-gray-400">
            TRANSACTION HISTORY
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No transactions yet</div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className={`text-xs font-bold uppercase ${TYPE_COLORS[tx.type] ?? 'text-white'}`}>
                      {tx.type}
                    </div>
                    {tx.description && <div className="mt-0.5 text-xs text-gray-500">{tx.description}</div>}
                    <div className="mt-0.5 text-xs text-gray-600">
                      {new Date(tx.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-heading font-bold ${
                      ['DEPOSIT', 'WIN', 'BONUS', 'REFUND'].includes(tx.type) ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {['DEPOSIT', 'WIN', 'BONUS', 'REFUND'].includes(tx.type) ? '+' : '-'}
                      {formatPHP(BigInt(tx.amountInCents))}
                    </div>
                    <div className="text-xs text-gray-500">Bal: {formatPHP(BigInt(tx.balanceAfterInCents))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-3">
              <CyberButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => void loadTransactions(page - 1)}>
                ←
              </CyberButton>
              <span className="text-sm text-gray-400">Page {page} / {totalPages}</span>
              <CyberButton variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => void loadTransactions(page + 1)}>
                →
              </CyberButton>
            </div>
          )}
        </GlassCard>

        {/* Deposit modal */}
        {depositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <GlassCard glow="cyan" className="w-full max-w-sm p-8 text-center">
              <div className="mb-3 text-4xl">🚧</div>
              <h2 className="font-heading text-2xl font-bold text-neon-cyan">DEPOSITS COMING SOON</h2>
              <p className="mt-2 text-sm text-gray-400">GCash, Maya, and more payment providers are being integrated.</p>
              <CyberButton variant="secondary" className="mt-6" onClick={() => setDepositModal(false)}>
                Close
              </CyberButton>
            </GlassCard>
          </div>
        )}
      </div>
    </main>
  );
}

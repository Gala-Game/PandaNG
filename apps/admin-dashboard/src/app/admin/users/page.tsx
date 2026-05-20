'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, banUser, unbanUser } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  kycStatus: string;
  vipLevel: string;
  createdAt: string;
  wallet: { balanceInCents: string; currency: string } | null;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => fetchUsers(page, 20, search || undefined),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      banUser(userId, reason),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => unbanUser(userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: User[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-panda-white">Users</h1>
        <span className="text-panda-white/40 font-heading text-sm">{total} total</span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by email or username..."
        className="w-full max-w-sm bg-dark-card/80 border border-dark-border rounded-xl px-4 py-2.5
                   text-panda-white text-sm font-body focus:border-neon-cyan/40 focus:outline-none"
      />

      {/* Table */}
      <div className="glass-card border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                {['Username', 'Email', 'Status', 'KYC', 'VIP', 'Balance', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-heading text-xs text-panda-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-panda-white/30 font-heading">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-panda-white/30 font-heading">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-dark-border/30 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-heading font-bold text-panda-white text-sm">{user.username}</td>
                    <td className="px-4 py-3 text-panda-white/60 text-sm font-body">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-heading text-xs font-bold ${
                        user.status === 'ACTIVE' ? 'bg-neon-green/10 text-neon-green' :
                        user.status === 'BANNED' ? 'bg-neon-pink/10 text-neon-pink' :
                        'bg-panda-white/10 text-panda-white/50'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-panda-white/50 text-xs font-heading">{user.kycStatus}</td>
                    <td className="px-4 py-3 text-neon-cyan/70 text-xs font-heading">{user.vipLevel}</td>
                    <td className="px-4 py-3 text-panda-white/70 text-sm font-heading">
                      {user.wallet ? `₱${(Number(user.wallet.balanceInCents) / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => banMutation.mutate({ userId: user.id, reason: 'Admin action' })}
                          className="admin-btn bg-neon-pink/10 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/20"
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => unbanMutation.mutate(user.id)}
                          className="admin-btn bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20"
                        >
                          Unban
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="admin-btn bg-dark-card border border-dark-border text-panda-white/60 disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-panda-white/40 font-heading text-xs">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="admin-btn bg-dark-card border border-dark-border text-panda-white/60 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

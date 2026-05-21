'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

// TODO: Replace with real API data from admin-api GET /users
const MOCK_USERS = [
  { id: 'u001', username: 'cyber_wolf99', email: 'wolf99@test.com', vipLevel: 3, status: 'ACTIVE', kycStatus: 'VERIFIED', balance: 4820.50, registered: '2024-01-15' },
  { id: 'u002', username: 'neon_panda42', email: 'panda42@test.com', vipLevel: 5, status: 'ACTIVE', kycStatus: 'VERIFIED', balance: 12340.00, registered: '2023-11-08' },
  { id: 'u003', username: 'slot_master7', email: 'slotm7@test.com', vipLevel: 1, status: 'SUSPENDED', kycStatus: 'PENDING', balance: 150.00, registered: '2024-03-22' },
  { id: 'u004', username: 'dragon_queen', email: 'dqueen@test.com', vipLevel: 4, status: 'ACTIVE', kycStatus: 'VERIFIED', balance: 7650.75, registered: '2023-09-30' },
  { id: 'u005', username: 'suspicious_x1', email: 'susx1@test.com', vipLevel: 0, status: 'BANNED', kycStatus: 'REJECTED', balance: 0, registered: '2024-05-01' },
  { id: 'u006', username: 'lucky_star88', email: 'lstar88@test.com', vipLevel: 2, status: 'ACTIVE', kycStatus: 'VERIFIED', balance: 3200.00, registered: '2024-02-14' },
  { id: 'u007', username: 'jackpot_king', email: 'jpking@test.com', vipLevel: 5, status: 'ACTIVE', kycStatus: 'VERIFIED', balance: 98420.00, registered: '2023-07-01' },
  { id: 'u008', username: 'new_player01', email: 'newp01@test.com', vipLevel: 0, status: 'ACTIVE', kycStatus: 'NONE', balance: 100.00, registered: '2024-06-10' },
  { id: 'u009', username: 'highroller_z', email: 'hrollz@test.com', vipLevel: 4, status: 'ACTIVE', kycStatus: 'VERIFIED', balance: 55000.00, registered: '2023-12-01' },
  { id: 'u010', username: 'retro_gamer_x', email: 'retrogx@test.com', vipLevel: 1, status: 'SUSPENDED', kycStatus: 'PENDING', balance: 220.00, registered: '2024-04-18' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-neon-green/10 text-neon-green border-neon-green/30',
    SUSPENDED: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
    BANNED: 'bg-neon-red/10 text-neon-red border-neon-red/30',
  };
  return map[status] ?? 'bg-gray-700 text-gray-300 border-gray-600';
};

const kycBadge = (status: string) => {
  const map: Record<string, string> = {
    VERIFIED: 'bg-neon-green/10 text-neon-green border-neon-green/30',
    PENDING: 'bg-gold/10 text-gold border-gold/30',
    REJECTED: 'bg-neon-red/10 text-neon-red border-neon-red/30',
    NONE: 'bg-gray-700/30 text-gray-400 border-gray-600',
  };
  return map[status] ?? 'bg-gray-700 text-gray-300 border-gray-600';
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterKyc, setFilterKyc] = useState('ALL');
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    const matchKyc = filterKyc === 'ALL' || u.kycStatus === filterKyc;
    return matchSearch && matchStatus && matchKyc;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-panda-white">Users Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search username or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-dark-card border border-dark-border focus:border-neon-orange/60 rounded-lg px-4 py-2 text-sm text-panda-white placeholder-gray-600 outline-none w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <select
          value={filterKyc}
          onChange={(e) => { setFilterKyc(e.target.value); setPage(1); }}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
        >
          <option value="ALL">All KYC</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
          <option value="NONE">None</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-dark-border text-left">
                {['ID', 'Username', 'Email', 'VIP', 'Status', 'KYC', 'Balance', 'Registered', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id} className="border-b border-dark-border/50 hover:bg-neon-orange/5 transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.id}</td>
                  <td className="px-4 py-3 text-panda-white font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-gold font-semibold">★ {u.vipLevel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('px-2 py-0.5 rounded border text-xs font-medium', statusBadge(u.status))}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('px-2 py-0.5 rounded border text-xs font-medium', kycBadge(u.kycStatus))}>
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neon-green font-mono">${u.balance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.registered}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {/* TODO: wire up actions to admin-api */}
                      <button className="text-xs text-neon-cyan hover:underline">View</button>
                      {u.status === 'ACTIVE' && (
                        <button className="text-xs text-neon-orange hover:underline">Suspend</button>
                      )}
                      {u.status !== 'BANNED' && (
                        <button className="text-xs text-neon-red hover:underline">Ban</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
          <span className="text-xs text-gray-500">{filtered.length} users</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-xs rounded border border-dark-border text-gray-400 hover:border-neon-orange/40 disabled:opacity-30 transition-colors">
              Prev
            </button>
            <span className="px-3 py-1 text-xs text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 text-xs rounded border border-dark-border text-gray-400 hover:border-neon-orange/40 disabled:opacity-30 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

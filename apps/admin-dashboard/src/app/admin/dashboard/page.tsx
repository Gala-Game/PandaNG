'use client';

import StatsCard from '@/components/StatsCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// TODO: Replace with real API data from admin-api GET /dashboard/stats
const MOCK_STATS = {
  totalUsers: '24,891',
  activeSessions: '1,247',
  totalWageredToday: '$482,310',
  activeJackpot: '$128,450',
};

// TODO: Replace with real API data from admin-api GET /dashboard/revenue
const MOCK_REVENUE = [
  { day: 'Mon', revenue: 38000 },
  { day: 'Tue', revenue: 52000 },
  { day: 'Wed', revenue: 41000 },
  { day: 'Thu', revenue: 67000 },
  { day: 'Fri', revenue: 89000 },
  { day: 'Sat', revenue: 112000 },
  { day: 'Sun', revenue: 94000 },
];

// TODO: Replace with real API data from admin-api GET /activity/recent
const MOCK_ACTIVITY = [
  { id: 1, type: 'USER_REGISTERED', user: 'cyber_wolf99', time: '2 min ago' },
  { id: 2, type: 'LARGE_WIN', user: 'neon_panda42', time: '5 min ago' },
  { id: 3, type: 'WITHDRAWAL_REQUEST', user: 'slot_master7', time: '8 min ago' },
  { id: 4, type: 'KYC_SUBMITTED', user: 'dragon_queen', time: '12 min ago' },
  { id: 5, type: 'FRAUD_SIGNAL', user: 'suspicious_x1', time: '15 min ago' },
];

const activityColor: Record<string, string> = {
  USER_REGISTERED: 'text-neon-cyan',
  LARGE_WIN: 'text-gold',
  WITHDRAWAL_REQUEST: 'text-neon-orange',
  KYC_SUBMITTED: 'text-neon-green',
  FRAUD_SIGNAL: 'text-neon-red',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-panda-white">Dashboard</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={MOCK_STATS.totalUsers}
          change={3.2}
          changeLabel="vs last week"
          variant="cyan"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatsCard
          title="Active Sessions"
          value={MOCK_STATS.activeSessions}
          change={12.8}
          changeLabel="vs yesterday"
          variant="green"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatsCard
          title="Total Wagered Today"
          value={MOCK_STATS.totalWageredToday}
          change={7.4}
          changeLabel="vs yesterday"
          variant="orange"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          title="Active Jackpot"
          value={MOCK_STATS.activeJackpot}
          change={-2.1}
          changeLabel="vs last trigger"
          variant="gold"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="font-heading text-lg font-semibold text-panda-white mb-4">Daily Revenue (7 days)</h3>
          {/* TODO: Replace with real API data */}
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 8 }}
                labelStyle={{ color: '#f8f8f8' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} dot={{ fill: '#FF6B00', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="font-heading text-lg font-semibold text-panda-white mb-4">Recent Activity</h3>
          {/* TODO: Replace with real API data */}
          <ul className="space-y-3">
            {MOCK_ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-neon-orange mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className={`font-body font-medium ${activityColor[item.type] ?? 'text-gray-300'}`}>
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-500 font-body"> — {item.user}</span>
                  <div className="text-xs text-gray-600 mt-0.5">{item.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

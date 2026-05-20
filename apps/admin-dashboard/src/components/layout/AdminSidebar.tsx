'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/admin',          label: 'Overview',    icon: '📊' },
  { href: '/admin/users',    label: 'Users',       icon: '👥' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
  { href: '/admin/jackpots', label: 'Jackpots',    icon: '🏆' },
  { href: '/admin/fraud',    label: 'Fraud',       icon: '🚨' },
  { href: '/admin/liveops',  label: 'LiveOps',     icon: '⚙️' },
  { href: '/admin/audit-log', label: 'Audit Log',  icon: '📜' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-dark-card/60 border-r border-dark-border
                      flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-dark-border">
        <div className="font-heading font-bold text-xl neon-text-cyan">🐼 PANDA NG</div>
        <div className="text-panda-white/30 text-xs font-heading mt-0.5">ADMIN DASHBOARD</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading text-sm font-medium transition-all',
              pathname === item.href
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                : 'text-panda-white/50 hover:text-panda-white hover:bg-white/5',
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <button className="w-full text-left text-panda-white/30 hover:text-panda-white/60
                           font-heading text-xs transition-colors">
          Sign Out →
        </button>
      </div>
    </aside>
  );
}

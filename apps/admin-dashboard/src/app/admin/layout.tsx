'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, admin, logout } = useAdminAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-deep-black">
      <AdminSidebar className="hidden md:flex flex-shrink-0" />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="font-heading text-lg font-semibold text-neon-orange tracking-wider uppercase">
            PandaNG Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-body hidden sm:block">
              {admin?.name} <span className="text-neon-orange/60">({admin?.role})</span>
            </span>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="text-xs font-body text-gray-400 hover:text-neon-orange border border-dark-border hover:border-neon-orange/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

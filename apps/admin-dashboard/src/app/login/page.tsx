'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { adminLogin, setAdminAuthToken } from '@/lib/api';
import { clsx } from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const { setAdmin, setLoading, setError, isLoading, error, clearError } = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      const response = await adminLogin({ email, password });
      setAdmin(response.admin, response.token);
      setAdminAuthToken(response.token);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl">🐼</span>
          <h1 className="font-heading text-3xl font-bold mt-3">
            <span className="text-neon-orange">PANDA</span>
            <span className="text-panda-white">NG</span>
          </h1>
          <p className="text-neon-orange/60 text-sm font-body tracking-widest uppercase mt-1">
            Admin Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-neon-orange/20 rounded-2xl p-8 shadow-neon-orange/10 shadow-lg">
          <h2 className="font-heading text-xl font-semibold text-panda-white mb-6">
            Sign in to Admin Dashboard
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg text-neon-red text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-body text-gray-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@panda-ng.com"
                className="w-full bg-deep-black border border-dark-border focus:border-neon-orange/60 rounded-lg px-4 py-2.5 text-panda-white placeholder-gray-600 font-body text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-body text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-deep-black border border-dark-border focus:border-neon-orange/60 rounded-lg px-4 py-2.5 text-panda-white placeholder-gray-600 font-body text-sm outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'w-full py-3 rounded-lg font-heading font-semibold text-sm uppercase tracking-wider transition-all duration-200',
                isLoading
                  ? 'bg-neon-orange/40 text-neon-orange/60 cursor-not-allowed'
                  : 'bg-neon-orange text-deep-black hover:bg-neon-orange/90 shadow-neon-orange hover:shadow-neon-orange/80',
              )}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600 font-body">
            Admin access only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}

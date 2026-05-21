'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirmPassword: '', referralCode: '',
  });
  const [validationError, setValidationError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    if (form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
        ...(form.referralCode ? { referralCode: form.referralCode } : {}),
      });
      router.push('/games');
    } catch {
      // error shown from store
    }
  };

  const displayError = validationError || error;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard glow="pink" className="p-8">
          <div className="mb-8 text-center">
            <div className="mb-2 text-5xl">🐼</div>
            <h1 className="font-heading text-3xl font-bold text-neon-pink">JOIN PANDA NG</h1>
            <p className="mt-1 text-sm text-gray-400">Create your account to start playing</p>
          </div>

          {displayError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username' as const, label: 'Username', type: 'text', placeholder: 'lucky_panda' },
              { key: 'email' as const, label: 'Email', type: 'email', placeholder: 'panda@example.com' },
              { key: 'password' as const, label: 'Password', type: 'password', placeholder: '••••••••' },
              { key: 'confirmPassword' as const, label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
              { key: 'referralCode' as const, label: 'Referral Code (optional)', type: 'text', placeholder: 'ABC123' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  required={key !== 'referralCode'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-neon-pink/50 focus:outline-none focus:ring-1 focus:ring-neon-pink/50"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <CyberButton type="submit" variant="danger" size="lg" isLoading={isLoading} className="w-full">
              CREATE ACCOUNT
            </CyberButton>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-neon-pink hover:underline">
              Login
            </Link>
          </p>
        </GlassCard>
      </div>
    </main>
  );
}

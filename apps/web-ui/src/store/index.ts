import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    vipLevel: string;
  } | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }
      },
      setUser: (user) => set({ user }),
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      },
    }),
    { name: 'panda-ng-auth', partialize: (state) => ({ user: state.user }) },
  ),
);

interface WalletState {
  balanceInCents: bigint;
  currency: string;
  setBalance: (balanceInCents: bigint, currency?: string) => void;
  decrementBalance: (amountInCents: bigint) => void;
  incrementBalance: (amountInCents: bigint) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  balanceInCents: 0n,
  currency: 'PHP',
  setBalance: (balanceInCents, currency = 'PHP') => set({ balanceInCents, currency }),
  decrementBalance: (amountInCents) =>
    set((s) => ({ balanceInCents: s.balanceInCents - amountInCents })),
  incrementBalance: (amountInCents) =>
    set((s) => ({ balanceInCents: s.balanceInCents + amountInCents })),
}));

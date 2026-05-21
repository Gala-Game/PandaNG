'use client';

import { create } from 'zustand';
import { walletApi } from '@/lib/api';

interface WalletState {
  balanceInCents: bigint;
  bonusBalanceInCents: bigint;
  currency: string;
  isLoading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  setBalance: (balanceInCents: bigint, currency?: string) => void;
  addWin: (amountInCents: bigint) => void;
  subtractBet: (amountInCents: bigint) => void;
  incrementBalance: (amountInCents: bigint) => void;
  decrementBalance: (amountInCents: bigint) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  balanceInCents: 0n,
  bonusBalanceInCents: 0n,
  currency: 'PHP',
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletApi.getBalance();
      set({
        balanceInCents: BigInt(data.balanceInCents ?? '0'),
        bonusBalanceInCents: BigInt(data.bonusBalanceInCents ?? '0'),
        currency: data.currency ?? 'PHP',
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch balance' });
    }
  },

  setBalance: (balanceInCents, currency = 'PHP') => set({ balanceInCents, currency }),

  addWin: (amountInCents) => {
    set((state) => ({ balanceInCents: state.balanceInCents + amountInCents }));
  },

  subtractBet: (amountInCents) => {
    set((state) => ({
      balanceInCents:
        state.balanceInCents >= amountInCents ? state.balanceInCents - amountInCents : 0n,
    }));
  },

  incrementBalance: (amountInCents) => {
    set((state) => ({ balanceInCents: state.balanceInCents + amountInCents }));
  },

  decrementBalance: (amountInCents) => {
    set((state) => ({
      balanceInCents:
        state.balanceInCents >= amountInCents ? state.balanceInCents - amountInCents : 0n,
    }));
  },
}));

/** Format cents as PHP currency string */
export function formatPHP(cents: bigint | string): string {
  const n = typeof cents === 'string' ? BigInt(cents) : cents;
  const whole = n / 100n;
  const fraction = n % 100n;
  const fracStr = fraction.toString().padStart(2, '0');
  return `₱${whole.toLocaleString()}.${fracStr}`;
}

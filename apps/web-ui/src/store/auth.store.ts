'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  vipLevel: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    referralCode?: string;
  }) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.login({ email, password });
          const { user, tokens } = result;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          set({
            user,
            accessToken: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : (err as { response?: { data?: { message?: string } } })?.response?.data
                  ?.message ?? 'Login failed';
          set({ isLoading: false, error: String(message) });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.register(data);
          const { user, tokens } = result;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          set({
            user,
            accessToken: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Registration failed';
          set({ isLoading: false, error: String(message) });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setTokens: (accessToken, refreshToken, user) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'panda-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

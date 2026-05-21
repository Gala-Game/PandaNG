import axios from 'axios';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:3008/api/v1';

export const adminApi = axios.create({ baseURL: ADMIN_API_URL });

adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export async function fetchUsers(page = 1, limit = 20, search?: string) {
  const { data } = await adminApi.get('/admin/users', { params: { page, limit, search } });
  return data.data;
}

export async function banUser(userId: string, reason: string) {
  const { data } = await adminApi.patch(`/admin/users/${userId}/ban`, { reason });
  return data.data;
}

export async function unbanUser(userId: string) {
  const { data } = await adminApi.patch(`/admin/users/${userId}/unban`);
  return data.data;
}

export async function fetchPendingWithdrawals(page = 1, limit = 20) {
  const { data } = await adminApi.get('/admin/withdrawals', { params: { page, limit } });
  return data.data;
}

export async function approveWithdrawal(id: string, notes?: string) {
  const { data } = await adminApi.patch(`/admin/withdrawals/${id}/approve`, { notes });
  return data.data;
}

export async function rejectWithdrawal(id: string, reason: string) {
  const { data } = await adminApi.patch(`/admin/withdrawals/${id}/reject`, { reason });
  return data.data;
}

export async function fetchJackpots() {
  const { data } = await adminApi.get('/admin/jackpots');
  return data.data;
}

export async function fetchFraudSignals(page = 1, limit = 20, isResolved?: boolean) {
  const { data } = await adminApi.get('/admin/fraud', {
    params: { page, limit, isResolved },
  });
  return data.data;
}

export async function resolveFraudSignal(signalId: string, notes?: string) {
  const { data } = await adminApi.patch(`/admin/fraud/${signalId}/resolve`, { notes });
  return data.data;
}

export async function fetchLiveOpsConfigs(environment = 'production') {
  const { data } = await adminApi.get('/admin/liveops', { params: { environment } });
  return data.data;
}

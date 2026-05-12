import axios from 'axios';

const ADMIN_API_BASE = process.env['NEXT_PUBLIC_ADMIN_API_URL'] ?? 'http://localhost:3008';
const GAME_ENGINE_BASE = process.env['NEXT_PUBLIC_GAME_ENGINE_URL'] ?? 'http://localhost:3001';
const PAYMENT_BASE = process.env['NEXT_PUBLIC_PAYMENT_URL'] ?? 'http://localhost:3003';

export const adminApiClient = axios.create({
  baseURL: ADMIN_API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export const gameEngineClient = axios.create({
  baseURL: GAME_ENGINE_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export const paymentClient = axios.create({
  baseURL: PAYMENT_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

/** Attach the admin JWT token to every request. */
export function setAdminAuthToken(token: string | null): void {
  if (token) {
    adminApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    gameEngineClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    paymentClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete adminApiClient.defaults.headers.common['Authorization'];
    delete gameEngineClient.defaults.headers.common['Authorization'];
    delete paymentClient.defaults.headers.common['Authorization'];
  }
}

// ---------------------------------------------------------------------------
// Admin API endpoints
// ---------------------------------------------------------------------------

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
    permissions: string[];
  };
}

/** TODO: wire up to admin-api POST /auth/login */
export async function adminLogin(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await adminApiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

/** TODO: wire up to admin-api GET /users */
export async function fetchAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vipLevel?: string;
  kycStatus?: string;
}) {
  const { data } = await adminApiClient.get('/users', { params });
  return data;
}

/** TODO: wire up to admin-api POST /users/:id/suspend */
export async function suspendUser(userId: string, reason: string) {
  const { data } = await adminApiClient.post(`/users/${userId}/suspend`, { reason });
  return data;
}

/** TODO: wire up to admin-api POST /users/:id/ban */
export async function banUser(userId: string, reason: string) {
  const { data } = await adminApiClient.post(`/users/${userId}/ban`, { reason });
  return data;
}

/** TODO: wire up to game-engine GET /jackpots */
export async function fetchJackpots() {
  const { data } = await gameEngineClient.get('/jackpots');
  return data;
}

/** TODO: wire up to game-engine PATCH /jackpots/:tier/rates */
export async function updateJackpotRates(tier: string, rates: { contributionRate: number; winThreshold: number }) {
  const { data } = await gameEngineClient.patch(`/jackpots/${tier}/rates`, rates);
  return data;
}

/** TODO: wire up to game-engine POST /jackpots/:tier/trigger */
export async function triggerJackpotWin(tier: string, winnerUserId: string) {
  const { data } = await gameEngineClient.post(`/jackpots/${tier}/trigger`, { winnerUserId });
  return data;
}

/** TODO: wire up to game-engine GET /rtp-profiles */
export async function fetchRTPProfiles() {
  const { data } = await gameEngineClient.get('/rtp-profiles');
  return data;
}

/** TODO: wire up to game-engine POST /rtp-profiles */
export async function createRTPProfile(profile: {
  gameType: string;
  rtpValue: number;
  volatility: string;
  name: string;
}) {
  const { data } = await gameEngineClient.post('/rtp-profiles', profile);
  return data;
}

/** TODO: wire up to game-engine PATCH /rtp-profiles/:id */
export async function updateRTPProfile(id: string, updates: { rtpValue?: number; isActive?: boolean }) {
  const { data } = await gameEngineClient.patch(`/rtp-profiles/${id}`, updates);
  return data;
}

/** TODO: wire up to admin-api GET /fraud/signals */
export async function fetchFraudSignals(params?: {
  severity?: string;
  resolved?: boolean;
  page?: number;
}) {
  const { data } = await adminApiClient.get('/fraud/signals', { params });
  return data;
}

/** TODO: wire up to admin-api POST /fraud/signals/:id/resolve */
export async function resolveFraudSignal(id: string, notes: string) {
  const { data } = await adminApiClient.post(`/fraud/signals/${id}/resolve`, { notes });
  return data;
}

/** TODO: wire up to payment-service GET /withdrawals/pending */
export async function fetchWithdrawals(params?: { status?: string; page?: number }) {
  const { data } = await paymentClient.get('/withdrawals', { params });
  return data;
}

/** TODO: wire up to payment-service POST /withdrawals/:id/approve */
export async function approveWithdrawal(id: string) {
  const { data } = await paymentClient.post(`/withdrawals/${id}/approve`);
  return data;
}

/** TODO: wire up to payment-service POST /withdrawals/:id/reject */
export async function rejectWithdrawal(id: string, reason: string) {
  const { data } = await paymentClient.post(`/withdrawals/${id}/reject`, { reason });
  return data;
}

/** TODO: wire up to admin-api GET /dashboard/stats */
export async function fetchDashboardStats() {
  const { data } = await adminApiClient.get('/dashboard/stats');
  return data;
}

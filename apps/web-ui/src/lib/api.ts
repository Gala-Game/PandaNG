import axios from 'axios';

const AUTH_BASE = process.env['NEXT_PUBLIC_AUTH_URL'] ?? 'http://localhost:3001/api/v1';
const WALLET_BASE = process.env['NEXT_PUBLIC_WALLET_URL'] ?? 'http://localhost:3002/api/v1';
const GAME_BASE = process.env['NEXT_PUBLIC_GAME_URL'] ?? 'http://localhost:3009/api/v1';
const JACKPOT_BASE = process.env['NEXT_PUBLIC_JACKPOT_URL'] ?? 'http://localhost:3003/api/v1';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

function createClient(baseURL: string) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (r) => r,
    async (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        const refresh = localStorage.getItem('refreshToken');
        if (refresh) {
          try {
            const res = await axios.post(`${AUTH_BASE}/auth/refresh`, { refreshToken: refresh });
            const { accessToken, refreshToken: newRefresh } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefresh);
            if (!error.config.headers) {
              error.config.headers = {};
            }
            error.config.headers.Authorization = `Bearer ${accessToken}`;
            return client.request(error.config);
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      }
      if (error instanceof Error) {
        return Promise.reject(error);
      }
      const wrappedError = new Error(String(error));
      (wrappedError as Error & { cause?: unknown }).cause = error;
      return Promise.reject(wrappedError);
    },
  );
  return client;
}

const authClient = createClient(AUTH_BASE);
const walletClient = createClient(WALLET_BASE);
const gameClient = createClient(GAME_BASE);
const jackpotClient = createClient(JACKPOT_BASE);

export const authApi = {
  register: (data: { email: string; username: string; password: string; referralCode?: string }) =>
    authClient.post('/auth/register', data).then((r) => r.data.data),
  login: (data: { email: string; password: string }) =>
    authClient.post('/auth/login', data).then((r) => r.data.data),
  refresh: (refreshToken: string) =>
    authClient.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),
  me: () => authClient.get('/auth/me').then((r) => r.data.data),
};

export const walletApi = {
  getBalance: () => walletClient.get('/wallet/balance').then((r) => r.data.data),
  getWallet: () => walletClient.get('/wallet').then((r) => r.data.data),
  getTransactions: (page = 1, limit = 20) =>
    walletClient.get(`/wallet/transactions?page=${page}&limit=${limit}`).then((r) => r.data.data),
};

export const gameApi = {
  startSession: (data: { gameType: string; betAmountInCents: number; clientSeed?: string }) =>
    gameClient.post('/games/start', data).then((r) => r.data.data),
  resolveSession: (
    sessionId: string,
    options: { cashOutAt?: number; target?: number; isOver?: boolean },
  ) => gameClient.post(`/games/${sessionId}/resolve`, options).then((r) => r.data.data),
  getSession: (sessionId: string) =>
    gameClient.get(`/games/${sessionId}`).then((r) => r.data.data),
  getHistory: (page = 1, limit = 20) =>
    gameClient.get(`/games?page=${page}&limit=${limit}`).then((r) => r.data.data),
  getRTPProfiles: (gameType?: string) =>
    gameClient
      .get(`/games/rtp-profiles${gameType ? `?gameType=${gameType}` : ''}`)
      .then((r) => r.data.data),
};

export const jackpotApi = {
  getAll: () => jackpotClient.get('/jackpots').then((r) => r.data.data),
};

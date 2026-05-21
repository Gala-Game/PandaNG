import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_GAME_SERVICE_URL ?? 'http://localhost:3009/api/v1';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1';
const WALLET_URL = process.env.NEXT_PUBLIC_WALLET_SERVICE_URL ?? 'http://localhost:3002/api/v1';

function createClient(baseURL: string) {
  const client = axios.create({ baseURL, withCredentials: false });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        // Attempt token refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
            localStorage.setItem('access_token', data.data.accessToken);
            localStorage.setItem('refresh_token', data.data.refreshToken);
            error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return client.request(error.config);
          } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    },
  );

  return client;
}

export const gameApi = createClient(BASE_URL);
export const authApi = createClient(AUTH_URL);
export const walletApi = createClient(WALLET_URL);

// ─── Game API helpers ─────────────────────────────────────────────────────────

export type GameType = 'SLOTS' | 'CRASH' | 'DRAGON_DICE' | 'PANDA_SPIN' | 'MINI_GAME';

export interface StartSessionResponse {
  sessionId: string;
  gameType: GameType;
  betAmountInCents: number;
  clientSeed: string;
  serverSeedHash: string;
  rtpProfile: {
    id: string;
    rtp: string;
    variance: string;
    minBetInCents: string;
    maxBetInCents: string;
  };
}

export async function startGameSession(
  gameType: GameType,
  betAmountInCents: number,
  clientSeed?: string,
): Promise<StartSessionResponse> {
  const { data } = await gameApi.post<{ data: StartSessionResponse }>('/games/session/start', {
    gameType,
    betAmountInCents,
    clientSeed,
  });
  return data.data;
}

export async function resolveSlots(sessionId: string) {
  const { data } = await gameApi.post('/games/session/resolve/slots', { sessionId });
  return data.data;
}

export async function resolveCrash(sessionId: string, cashoutMultiplier: number) {
  const { data } = await gameApi.post('/games/session/resolve/crash', {
    sessionId,
    cashoutMultiplier,
  });
  return data.data;
}

export async function resolveDice(
  sessionId: string,
  target: number,
  mode: 'over' | 'under',
) {
  const { data } = await gameApi.post('/games/session/resolve/dice', {
    sessionId,
    target,
    mode,
  });
  return data.data;
}

export async function resolveWheel(sessionId: string) {
  const { data } = await gameApi.post('/games/session/resolve/wheel', { sessionId });
  return data.data;
}

export async function resolveTreasure(sessionId: string, pickedIndices: number[]) {
  const { data } = await gameApi.post('/games/session/resolve/treasure', {
    sessionId,
    pickedIndices,
  });
  return data.data;
}

export async function verifySession(sessionId: string) {
  const { data } = await gameApi.get(`/games/session/${sessionId}/verify`);
  return data.data;
}

export async function getBalance() {
  const { data } = await walletApi.get('/wallet/balance');
  return data.data as { balanceInCents: string; bonusBalanceInCents: string; currency: string };
}

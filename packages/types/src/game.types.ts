export enum GameType {
  SLOTS = 'SLOTS',
  MINI_GAME = 'MINI_GAME',
  SCRATCH_CARD = 'SCRATCH_CARD',
  ROULETTE = 'ROULETTE',
  CRASH = 'CRASH',
  PANDA_SPIN = 'PANDA_SPIN',
  BAMBOO_BLAST = 'BAMBOO_BLAST',
  DRAGON_DICE = 'DRAGON_DICE',
}

export enum GameSessionStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  DISPUTED = 'DISPUTED',
}

export interface GameSession {
  id: string;
  userId: string;
  gameType: GameType;
  betAmountInCents: bigint;
  winAmountInCents: bigint;
  rtpProfileId: string;
  seed: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  status: GameSessionStatus;
  metadata?: Record<string, unknown>;
  startedAt: Date;
  endedAt?: Date;
}

export interface RTPProfile {
  id: string;
  gameType: GameType;
  rtp: number;
  variance: string;
  minBetInCents: bigint;
  maxBetInCents: bigint;
  isActive: boolean;
}

export interface SpinResult {
  sessionId: string;
  symbols: string[][];
  winLines: WinLine[];
  totalWinInCents: bigint;
  multiplier: number;
  jackpotTrigger?: { tier: string; probability: number };
  freeSpinsAwarded?: number;
  isBonus: boolean;
}

export interface WinLine {
  lineId: number;
  symbols: string[];
  payoutMultiplier: number;
  winAmountInCents: bigint;
}

export interface GameResult {
  sessionId: string;
  gameType: GameType;
  betAmountInCents: bigint;
  winAmountInCents: bigint;
  netChangeInCents: bigint;
  rtp: number;
  isJackpotWin: boolean;
  details: Record<string, unknown>;
  completedAt: Date;
}

export enum JackpotTier {
  MINI = 'MINI',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  GRAND = 'GRAND',
}

export interface Jackpot {
  id: string;
  tier: JackpotTier;
  name: string;
  seedAmountInCents: bigint;
  currentAmountInCents: bigint;
  contributionRate: number;
  maxWinMultiplier: number;
  isActive: boolean;
  lastWonAt?: Date;
  lastWonBy?: string;
}

export interface JackpotWin {
  id: string;
  jackpotId: string;
  userId: string;
  username: string;
  amountInCents: bigint;
  gameSessionId: string;
  tier: JackpotTier;
  confirmedAt: Date;
  createdAt: Date;
}

export interface JackpotTickPayload {
  jackpots: Array<{
    id: string;
    tier: JackpotTier;
    currentAmountInCents: string; // serialized bigint
    name: string;
  }>;
  timestamp: number;
}

export interface JackpotWinPayload {
  win: JackpotWin & { amountInCents: string };
  newSeedAmountInCents: string;
  tier: JackpotTier;
}

export interface ContributeToJackpotDto {
  jackpotId: string;
  betAmountInCents: number;
  userId: string;
  gameSessionId: string;
}

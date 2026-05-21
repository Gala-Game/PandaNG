export interface GameSessionConfig {
  userId: string;
  gameType: string;
  betInCents: bigint;
  rtpProfileId: string;
  clientSeed: string;
}

export interface GameSessionState {
  id: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface ResolvedSession {
  sessionId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: unknown;
  winInCents: bigint;
}

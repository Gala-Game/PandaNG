import { generateFloat } from '../rng/provably-fair';

const HOUSE_EDGE = 0.04; // 4%
const CRASH_MIN = 1.0;
const CRASH_MAX = 1000.0;

/**
 * Calculate the crash point for a round.
 * Uses: max(1, 100 / (1 - float) * (1 - houseEdge))
 * If float < HOUSE_EDGE the house wins immediately (returns 1.0).
 */
export function calculateCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): number {
  const float = generateFloat(serverSeed, clientSeed, nonce);
  if (float < HOUSE_EDGE) return CRASH_MIN;

  const raw = 100 / (1 - float) * (1 - HOUSE_EDGE);
  const capped = Math.min(raw, CRASH_MAX);
  return Math.round(capped * 100) / 100;
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

export interface CrashResult {
  crashPoint: number;
  cashedOut: boolean;
  multiplier: number;
  winInCents: bigint;
  netChangeInCents: bigint;
}

export function getCrashResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betInCents: bigint,
  cashOutAt: number,
): CrashResult {
  const crashPoint = calculateCrashPoint(serverSeed, clientSeed, nonce);
  const cashedOut = cashOutAt > 0 && cashOutAt <= crashPoint;
  const multiplier = cashedOut ? cashOutAt : 0;
  // Use integer arithmetic: multiplier expressed as basis-points (×100) to avoid float money
  const winInCents = cashedOut
    ? (betInCents * BigInt(Math.round(multiplier * 100))) / 100n
    : 0n;
  const netChangeInCents = winInCents - betInCents;

  return { crashPoint, cashedOut, multiplier, winInCents, netChangeInCents };
}

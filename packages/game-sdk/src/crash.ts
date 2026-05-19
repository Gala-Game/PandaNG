/**
 * Crash game engine — Panda Crash
 *
 * The crash point is computed from the server seed before the round starts.
 * The house edge is implemented by busting at 1.00× with probability = houseEdge.
 *
 * Algorithm (industry standard):
 *   1. Compute H = HMAC-SHA256(serverSeed, nonce)
 *   2. e = (2^52 - 1) / (H mod 2^52)
 *   3. Apply house edge: if H mod (1/houseEdge) == 0 → bust at 1.00
 *   4. Crash multiplier = floor(100 * e) / 100
 */

import { createHmac } from 'crypto';

const HOUSE_EDGE = 0.01; // 1%
const BUST_MODULO = Math.round(1 / HOUSE_EDGE); // pre-computed constant

/**
 * Compute the crash multiplier from seeds. Minimum is 1.00×.
 */
export function computeCrashPoint(serverSeed: string, nonce: number): number {
  const hmac = createHmac('sha256', serverSeed);
  hmac.update(String(nonce));
  const hex = hmac.digest('hex');

  // Use first 13 hex chars = 52 bits
  const h = parseInt(hex.slice(0, 13), 16);
  const MAX = 2 ** 52 - 1;

  // Instant bust for house edge
  if (h % BUST_MODULO === 0) return 1.0;

  const hMod = h % MAX;
  // hMod === 0 when h equals exactly MAX (2^52 - 1). That case is not caught by the BUST_MODULO
  // check above because MAX % BUST_MODULO is not zero. Cap at 100× to avoid division by zero.
  if (hMod === 0) return 100.0;

  const e = MAX / hMod;
  const multiplier = Math.floor(e * 100) / 100;
  return Math.max(1.0, multiplier);
}

/**
 * Calculate the win for a player who cashed out at a given multiplier.
 * Returns 0 if the cashout was after the crash.
 */
export function calculateCrashWin(
  betAmountInCents: bigint,
  cashoutMultiplier: number,
  crashPoint: number,
): bigint {
  if (cashoutMultiplier > crashPoint) return 0n; // busted
  const multiplierBps = BigInt(Math.floor(cashoutMultiplier * 100));
  return (betAmountInCents * multiplierBps) / 100n;
}

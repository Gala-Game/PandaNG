/**
 * Provably Fair RNG
 *
 * Outcome generation uses HMAC-SHA256(serverSeed, clientSeed:nonce).
 * The server seed hash is revealed to the client BEFORE the session starts,
 * but the actual server seed is only revealed AFTER the session is completed.
 * This guarantees the outcome could not have been manipulated after commitment.
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';

export function generateServerSeed(): string {
  return randomBytes(32).toString('hex');
}

export function generateClientSeed(): string {
  return randomBytes(16).toString('hex');
}

export function hashServerSeed(serverSeed: string): string {
  return createHash('sha256').update(serverSeed).digest('hex');
}

/**
 * Generate a float in [0, 1) from server seed + client seed + nonce.
 * Uses the same algorithm used by industry-standard provably fair casinos.
 */
export function generateFloat(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const hex = hmac.digest('hex');

  // Take first 8 hex chars → 4 bytes → divide by 2^32 for [0,1)
  const value = parseInt(hex.slice(0, 8), 16);
  return value / 0x100000000;
}

/**
 * Generate multiple floats in [0,1) for multi-outcome games (e.g. slot reels).
 */
export function generateFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    // Each float gets its own HMAC with sub-nonce
    const hmac = createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}:${i}`);
    const hex = hmac.digest('hex');
    const value = parseInt(hex.slice(0, 8), 16);
    results.push(value / 0x100000000);
  }
  return results;
}

/**
 * Pick a random integer in [min, max] (inclusive) from a float.
 */
export function floatToInt(float: number, min: number, max: number): number {
  return Math.floor(float * (max - min + 1)) + min;
}

/**
 * Verify that a given outcome was produced honestly using the revealed seeds.
 * Returns true if the recomputed float matches (within floating-point tolerance).
 */
export function verifyOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  claimedFloat: number,
): boolean {
  const expected = generateFloat(serverSeed, clientSeed, nonce);
  return Math.abs(expected - claimedFloat) < Number.EPSILON * 100;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return timingSafeEqual(bufA, bufB);
}

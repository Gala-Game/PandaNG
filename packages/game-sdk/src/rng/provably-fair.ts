import { createHmac, createHash, randomBytes } from 'crypto';

/**
 * Generate a random 64-hex server seed (32 bytes).
 * Never reveal this to the client until after the game round ends.
 */
export function generateServerSeed(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash the server seed with SHA-256. This commitment is shown to the client
 * BEFORE the round, allowing post-round verification.
 */
export function hashServerSeed(serverSeed: string): string {
  return createHash('sha256').update(serverSeed).digest('hex');
}

/**
 * Generate a random 16-hex client seed. Players may supply their own.
 */
export function generateClientSeed(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Verify that a revealed server seed matches the committed hash.
 */
export function verifyResult(serverSeed: string, serverSeedHash: string): boolean {
  const actual = hashServerSeed(serverSeed);
  // Constant-time comparison to prevent timing attacks
  if (actual.length !== serverSeedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ serverSeedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Generate a single float in [0, 1) using HMAC-SHA256.
 * Uses the first 4 bytes of HMAC(serverSeed, `${clientSeed}:${nonce}`) as a
 * 32-bit unsigned integer then divides by 2^32.
 */
export function generateFloat(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const digest = hmac.digest();
  // 32-bit big-endian unsigned integer — stays well within safe integer range
  const value =
    ((digest[0] ?? 0) * 16777216) +
    ((digest[1] ?? 0) * 65536) +
    ((digest[2] ?? 0) * 256) +
    (digest[3] ?? 0);
  return value / 4294967296; // divide by 2^32
}

/**
 * Generate `count` independent floats. Each uses a sub-nonce cursor suffix so
 * one base nonce produces multiple independent draws without state.
 */
export function generateFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): number[] {
  const results: number[] = [];
  for (let cursor = 0; cursor < count; cursor++) {
    const hmac = createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}:${cursor}`);
    const digest = hmac.digest();
    const value =
      ((digest[0] ?? 0) * 16777216) +
      ((digest[1] ?? 0) * 65536) +
      ((digest[2] ?? 0) * 256) +
      (digest[3] ?? 0);
    results.push(value / 4294967296);
  }
  return results;
}

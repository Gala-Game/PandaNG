import { createHash, randomBytes } from 'crypto';

export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateUUID(): string {
  const bytes = randomBytes(16);
  // Set version 4 (bits 12-15 of time_hi_and_version)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  // Set variant bits (RFC 4122: 10xxxxxx)
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function sha256Buffer(input: Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateGameSeed(): string {
  return randomBytes(32).toString('hex');
}

export function generateNonce(): string {
  return Date.now().toString(36) + randomBytes(8).toString('hex');
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

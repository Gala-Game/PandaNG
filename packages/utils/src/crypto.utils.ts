import { createHash, randomBytes } from 'crypto';

export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateUUID(): string {
  return randomBytes(16)
    .toString('hex')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-4$3-a$4-$5');
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
    result |= a.charCodeAt(i) ^ (b.charCodeAt(i) ?? 0);
  }
  return result === 0;
}

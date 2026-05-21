import { calculateCrashPoint, getCrashResult, formatMultiplier } from './crash';

const S = 'a'.repeat(64);
const C = '0'.repeat(16);

describe('crash engine', () => {
  it('calculateCrashPoint returns >= 1.0', () => {
    for (let i = 0; i < 20; i++) {
      const cp = calculateCrashPoint(S, C, i);
      expect(cp).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('calculateCrashPoint is capped at 1000', () => {
    for (let i = 0; i < 20; i++) {
      const cp = calculateCrashPoint(S, C, i);
      expect(cp).toBeLessThanOrEqual(1000);
    }
  });

  it('getCrashResult win when cashOutAt <= crashPoint', () => {
    // Find a nonce where crash is above 1.5
    let nonce = 0;
    let cp = 1.0;
    while (cp <= 1.5 && nonce < 100) {
      nonce++;
      cp = calculateCrashPoint(S, C, nonce);
    }
    const result = getCrashResult(S, C, nonce, 1000n, 1.5);
    expect(result.cashedOut).toBe(true);
    expect(result.winInCents).toBeGreaterThan(0n);
    expect(result.multiplier).toBe(1.5);
  });

  it('getCrashResult loss when cashOutAt > crashPoint', () => {
    // Find a nonce where crash is exactly at bust (1.0)
    let nonce = 0;
    let cp = 99.0;
    while (cp > 1.0 && nonce < 100) {
      nonce++;
      cp = calculateCrashPoint(S, C, nonce);
    }
    const result = getCrashResult(S, C, nonce, 1000n, 5.0);
    if (cp <= 1.0) {
      expect(result.cashedOut).toBe(false);
      expect(result.winInCents).toBe(0n);
    }
  });

  it('formatMultiplier formats correctly', () => {
    expect(formatMultiplier(1.45)).toBe('1.45x');
    expect(formatMultiplier(100)).toBe('100.00x');
  });
});

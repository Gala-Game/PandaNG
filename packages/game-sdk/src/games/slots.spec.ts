import { spinReels, calculateWins, getSlotsResult, SYMBOLS, type SlotSymbol } from './slots';

const S = 'a'.repeat(64);
const C = '0'.repeat(16);

describe('slots engine', () => {
  it('spinReels returns a 5x3 grid of valid symbols', () => {
    const reels = spinReels(S, C, 0);
    expect(reels).toHaveLength(5);
    reels.forEach((col) => {
      expect(col).toHaveLength(3);
      col.forEach((sym) => expect(SYMBOLS).toContain(sym));
    });
  });

  it('calculateWins with matching row returns wins', () => {
    // All 🐼 on row 0 (top row) = 5-of-a-kind match on payline 0
    const reels: SlotSymbol[][] = [
      ['🐼', '🎋', '💎'],
      ['🐼', '💎', '🐼'],
      ['🐼', '🐼', '🎋'],
      ['🐼', '🎋', '💎'],
      ['🐼', '💎', '🐼'],
    ];
    const wins = calculateWins(reels, 1000n);
    // Should find at least payline 0 (top row all 🐼, 5-of-kind)
    expect(wins.length).toBeGreaterThanOrEqual(1);
    const topLine = wins.find((w) => w.lineId === 0);
    expect(topLine).toBeDefined();
    expect(topLine?.count).toBe(5);
  });

  it('getSlotsResult returns valid structure', () => {
    const result = getSlotsResult(S, C, 0, 1000n);
    expect(result.reels).toHaveLength(5);
    expect(typeof result.totalWinInCents).toBe('bigint');
    expect(typeof result.multiplier).toBe('number');
    expect(typeof result.isJackpotEligible).toBe('boolean');
  });

  it('getSlotsResult totalWinInCents is non-negative', () => {
    for (let i = 0; i < 10; i++) {
      const r = getSlotsResult(S, C, i, 1000n);
      expect(r.totalWinInCents).toBeGreaterThanOrEqual(0n);
    }
  });
});

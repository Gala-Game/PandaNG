import { rollDice, getDiceResult, getDicePayoutMultiplier } from './dice';

const S = 'a'.repeat(64);
const C = '0'.repeat(16);

describe('dice engine', () => {
  it('rollDice returns value in [0, 100)', () => {
    for (let i = 0; i < 20; i++) {
      const roll = rollDice(S, C, i);
      expect(roll).toBeGreaterThanOrEqual(0);
      expect(roll).toBeLessThan(100);
    }
  });

  it('rollDice is deterministic', () => {
    expect(rollDice(S, C, 0)).toBe(rollDice(S, C, 0));
  });

  it('getDicePayoutMultiplier for over 50 ~= 2x', () => {
    const payout = getDicePayoutMultiplier(50, true);
    // (100 - 2) / 50 = 1.96
    expect(payout).toBeCloseTo(1.96, 1);
  });

  it('getDiceResult win when roll > target (isOver=true)', () => {
    // Find a nonce where roll > 10 (likely)
    let nonce = 0;
    let roll = rollDice(S, C, nonce);
    while (roll <= 10 && nonce < 50) {
      nonce++;
      roll = rollDice(S, C, nonce);
    }
    const result = getDiceResult(S, C, nonce, 1000n, 10, true);
    expect(result.won).toBe(true);
    expect(result.winInCents).toBeGreaterThan(0n);
  });

  it('getDiceResult loss when roll > target (isOver=false)', () => {
    // Find a nonce where roll > 10
    let nonce = 0;
    let roll = rollDice(S, C, nonce);
    while (roll <= 10 && nonce < 50) {
      nonce++;
      roll = rollDice(S, C, nonce);
    }
    // Roll > 10, so "isOver=false, target=10" should LOSE
    const result = getDiceResult(S, C, nonce, 1000n, 10, false);
    expect(result.won).toBe(false);
    expect(result.winInCents).toBe(0n);
  });
});

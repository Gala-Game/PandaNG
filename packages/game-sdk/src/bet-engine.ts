/**
 * Bet validation and RTP-based outcome control.
 * All monetary values in BigInt cents. No floating-point for money.
 */

export interface RTPProfile {
  minBetInCents: bigint;
  maxBetInCents: bigint;
  rtp: number; // 0.0–1.0, e.g. 0.96 for 96%
  variance: 'low' | 'medium' | 'high';
}

export type BetValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateBet(
  betAmountInCents: bigint,
  profile: RTPProfile,
  walletBalanceInCents: bigint,
): BetValidationResult {
  if (betAmountInCents <= 0n) {
    return { ok: false, reason: 'Bet amount must be positive' };
  }
  if (betAmountInCents < profile.minBetInCents) {
    return {
      ok: false,
      reason: `Minimum bet is ${profile.minBetInCents} cents (₱${Number(profile.minBetInCents) / 100})`,
    };
  }
  if (betAmountInCents > profile.maxBetInCents) {
    return {
      ok: false,
      reason: `Maximum bet is ${profile.maxBetInCents} cents (₱${Number(profile.maxBetInCents) / 100})`,
    };
  }
  if (walletBalanceInCents < betAmountInCents) {
    return { ok: false, reason: 'Insufficient wallet balance' };
  }
  return { ok: true };
}

/**
 * Compute the jackpot contribution amount (integer, no floats).
 * contributionRateBps: basis points (1 bps = 0.01%). E.g. 50 = 0.5%.
 */
export function computeJackpotContribution(
  betAmountInCents: bigint,
  contributionRateBps: number,
): bigint {
  return (betAmountInCents * BigInt(contributionRateBps)) / 10000n;
}

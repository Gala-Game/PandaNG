/**
 * Dice game engine — Panda Dice
 * Roll-over / roll-under with configurable target in range [2, 98].
 * House edge is baked into payout multiplier.
 */

import { generateFloat } from './rng';

const HOUSE_EDGE = 0.01; // 1%

/**
 * Roll a dice number in [1, 100] using seeds.
 */
export function rollDice(serverSeed: string, clientSeed: string, nonce: number): number {
  const float = generateFloat(serverSeed, clientSeed, nonce);
  return Math.floor(float * 100) + 1; // [1..100]
}

/**
 * Calculate payout multiplier for a roll-over bet.
 * E.g. target=55, mode='over' → win if roll > 55 → win chance = 45%
 */
export function getDiceMultiplier(target: number, mode: 'over' | 'under'): number {
  const winChance = mode === 'over' ? (100 - target) / 100 : (target - 1) / 100;
  if (winChance <= 0) return 0;
  return Math.floor(((1 - HOUSE_EDGE) / winChance) * 10000) / 10000;
}

export interface DiceResult {
  roll: number;
  target: number;
  mode: 'over' | 'under';
  isWin: boolean;
  multiplier: number;
  winAmountInCents: bigint;
}

export function resolveDice(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betAmountInCents: bigint,
  target: number,
  mode: 'over' | 'under',
): DiceResult {
  const roll = rollDice(serverSeed, clientSeed, nonce);
  const isWin = mode === 'over' ? roll > target : roll < target;
  const multiplier = getDiceMultiplier(target, mode);
  const multiplierBps = BigInt(Math.floor(multiplier * 10000));
  const winAmountInCents = isWin ? (betAmountInCents * multiplierBps) / 10000n : 0n;

  return { roll, target, mode, isWin, multiplier, winAmountInCents };
}

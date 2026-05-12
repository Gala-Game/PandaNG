import { generateFloat } from '../rng/provably-fair';

const HOUSE_EDGE_PCT = 2; // 2%
const MAX_PAYOUT_MULTIPLIER = 9900;

/** Roll a dice, returning a value in [0.00, 99.99] (2 decimal precision) */
export function rollDice(serverSeed: string, clientSeed: string, nonce: number): number {
  const float = generateFloat(serverSeed, clientSeed, nonce);
  return Math.floor(float * 10000) / 100;
}

/**
 * Calculate the payout multiplier for a dice bet.
 * chance = isOver ? (100 - target) : target
 * payout = (100 - houseEdge%) / chance
 */
export function getDicePayoutMultiplier(target: number, isOver: boolean): number {
  const chance = isOver ? 100 - target : target;
  if (chance <= 0) return MAX_PAYOUT_MULTIPLIER;
  const payout = (100 - HOUSE_EDGE_PCT) / chance;
  return Math.min(Math.round(payout * 10000) / 10000, MAX_PAYOUT_MULTIPLIER);
}

export interface DiceResult {
  roll: number;
  won: boolean;
  payout: number;
  winInCents: bigint;
  netChangeInCents: bigint;
}

export function getDiceResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betInCents: bigint,
  target: number,
  isOver: boolean,
): DiceResult {
  const roll = rollDice(serverSeed, clientSeed, nonce);
  const won = isOver ? roll > target : roll < target;
  const payout = getDicePayoutMultiplier(target, isOver);
  const winInCents = won ? BigInt(Math.floor(Number(betInCents) * payout)) : 0n;
  const netChangeInCents = winInCents - betInCents;

  return { roll, won, payout, winInCents, netChangeInCents };
}

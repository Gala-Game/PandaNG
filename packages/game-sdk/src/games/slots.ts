import { generateFloats } from '../rng/provably-fair';

export const SYMBOLS = ['🐼', '🎋', '💎', '7️⃣', '🌸', '⭐', '🔔', '🍀'] as const;
export type SlotSymbol = (typeof SYMBOLS)[number];

/** Relative weights — higher = more frequent */
export const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  '🐼': 5,
  '🎋': 8,
  '💎': 10,
  '7️⃣': 12,
  '🌸': 14,
  '⭐': 16,
  '🔔': 18,
  '🍀': 20,
};

const TOTAL_WEIGHT = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * [3-of-a-kind, 4-of-a-kind, 5-of-a-kind] multipliers per symbol.
 */
export const PAYOUT_TABLE: Record<SlotSymbol, [number, number, number]> = {
  '🐼': [5, 20, 100],
  '🎋': [3, 10, 50],
  '💎': [2, 8, 30],
  '7️⃣': [2, 6, 20],
  '🌸': [1, 4, 15],
  '⭐': [1, 3, 10],
  '🔔': [1, 2, 8],
  '🍀': [1, 2, 5],
};

/** 20 paylines on a 5×3 grid — each is [col, row] pairs */
export const PAYLINES: Array<Array<[number, number]>> = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
  [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
  [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
  [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
  [[0, 0], [1, 0], [2, 1], [3, 0], [4, 0]],
  [[0, 2], [1, 2], [2, 1], [3, 2], [4, 2]],
  [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]],
  [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1]],
  [[0, 0], [1, 1], [2, 1], [3, 1], [4, 0]],
  [[0, 2], [1, 1], [2, 1], [3, 1], [4, 2]],
  [[0, 1], [1, 0], [2, 1], [3, 2], [4, 1]],
  [[0, 1], [1, 2], [2, 1], [3, 0], [4, 1]],
  [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2]],
  [[0, 2], [1, 2], [2, 1], [3, 0], [4, 0]],
  [[0, 1], [1, 1], [2, 0], [3, 1], [4, 1]],
  [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]],
  [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]],
  [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]],
  [[0, 0], [1, 2], [2, 0], [3, 2], [4, 0]],
];

function weightedSymbol(float: number): SlotSymbol {
  let cumulative = 0;
  const target = float * TOTAL_WEIGHT;
  for (const sym of SYMBOLS) {
    cumulative += SYMBOL_WEIGHTS[sym];
    if (target < cumulative) return sym;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

/** Spin the reels — returns a 5×3 grid of symbols */
export function spinReels(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): SlotSymbol[][] {
  const floats = generateFloats(serverSeed, clientSeed, nonce, 15);
  const reels: SlotSymbol[][] = [];
  for (let col = 0; col < 5; col++) {
    const column: SlotSymbol[] = [];
    for (let row = 0; row < 3; row++) {
      column.push(weightedSymbol(floats[col * 3 + row] ?? 0));
    }
    reels.push(column);
  }
  return reels;
}

export interface WinLine {
  lineId: number;
  symbols: SlotSymbol[];
  count: number;
  multiplier: number;
  winInCents: bigint;
}

/** Evaluate all 20 paylines for wins of 3+ matching symbols from the left */
export function calculateWins(reels: SlotSymbol[][], betInCents: bigint): WinLine[] {
  const wins: WinLine[] = [];

  for (let i = 0; i < PAYLINES.length; i++) {
    const payline = PAYLINES[i];
    if (!payline) continue;

    const lineSymbols: SlotSymbol[] = payline.map(([col, row]) => {
      const column = reels[col];
      return (column ? column[row] : undefined) ?? '🍀';
    });

    const first = lineSymbols[0];
    if (!first) continue;

    let count = 1;
    for (let j = 1; j < lineSymbols.length; j++) {
      if (lineSymbols[j] === first) count++;
      else break;
    }

    if (count >= 3) {
      const payouts = PAYOUT_TABLE[first];
      const multiplier = payouts[count - 3] ?? 0;
      if (multiplier > 0) {
        wins.push({
          lineId: i,
          symbols: lineSymbols.slice(0, count),
          count,
          multiplier,
          winInCents: betInCents * BigInt(multiplier),
        });
      }
    }
  }

  return wins;
}

export interface SlotsResult {
  reels: SlotSymbol[][];
  wins: WinLine[];
  totalWinInCents: bigint;
  multiplier: number;
  isJackpotEligible: boolean;
}

export function getSlotsResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betInCents: bigint,
): SlotsResult {
  const reels = spinReels(serverSeed, clientSeed, nonce);
  const wins = calculateWins(reels, betInCents);
  const totalWinInCents = wins.reduce((sum, w) => sum + w.winInCents, 0n);
  const multiplier = wins.reduce((sum, w) => sum + w.multiplier, 0);

  // Jackpot eligible: any 5 Panda symbols on any payline
  const isJackpotEligible = wins.some((w) => w.symbols[0] === '🐼' && w.count === 5);

  return { reels, wins, totalWinInCents, multiplier, isJackpotEligible };
}

/**
 * Slot machine outcome engine for Panda Fortune Slots.
 * 5 reels × 3 rows, 20 paylines. All monetary values in BigInt cents.
 */

import { generateFloats } from './rng';

// Symbol weights (higher = more common)
const SYMBOLS = ['🐼', '🎋', '🌕', '💎', '🌸', '🍃', '🔴', '💰'] as const;
export type SlotSymbol = (typeof SYMBOLS)[number];

const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  '💰': 2,  // jackpot / highest value — rarest
  '💎': 5,
  '🐼': 8,
  '🌕': 12,
  '🌸': 15,
  '🎋': 18,
  '🍃': 20,
  '🔴': 20,  // scatter
};

const TOTAL_WEIGHT = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);

// 20 standard paylines on a 5×3 grid (row indices 0-2 per reel)
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // middle row
  [0, 0, 0, 0, 0], // top row
  [2, 2, 2, 2, 2], // bottom row
  [0, 1, 2, 1, 0], // V-shape
  [2, 1, 0, 1, 2], // inverted V
  [0, 0, 1, 2, 2], // diagonal down
  [2, 2, 1, 0, 0], // diagonal up
  [1, 0, 1, 2, 1], // zigzag 1
  [1, 2, 1, 0, 1], // zigzag 2
  [0, 1, 1, 1, 2], // step right
  [2, 1, 1, 1, 0], // step left
  [0, 0, 0, 1, 2], // top-left L
  [2, 2, 2, 1, 0], // bottom-left L
  [0, 1, 2, 2, 2], // top-right L
  [2, 1, 0, 0, 0], // bottom-right L
  [1, 0, 0, 0, 1], // U-shape
  [1, 2, 2, 2, 1], // inverted U
  [0, 2, 0, 2, 0], // checkerboard top
  [2, 0, 2, 0, 2], // checkerboard bottom
  [1, 1, 0, 1, 1], // dip
];

// Payout multipliers: how many symbols in a line → multiplier on bet
export const SLOT_PAYOUTS: Record<SlotSymbol, Record<number, number>> = {
  '💰': { 3: 50, 4: 200, 5: 1000 },
  '💎': { 3: 20, 4: 80,  5: 400  },
  '🐼': { 3: 10, 4: 40,  5: 200  },
  '🌕': { 3: 6,  4: 20,  5: 80   },
  '🌸': { 3: 4,  4: 12,  5: 50   },
  '🎋': { 3: 3,  4: 8,   5: 30   },
  '🍃': { 3: 2,  4: 5,   5: 15   },
  '🔴': { 3: 2,  4: 5,   5: 10   }, // scatter — also triggers bonus
};

// Free spins triggered by scatter (🔴) count on any position
const FREE_SPIN_TRIGGERS: Record<number, number> = { 3: 8, 4: 15, 5: 25 };

export interface SlotSpinResult {
  reels: SlotSymbol[][];      // 5 reels × 3 rows
  winLines: WinLineResult[];
  totalMultiplier: number;
  totalWinInCents: bigint;
  scatterCount: number;
  freeSpinsAwarded: number;
  isJackpotSpin: boolean;
}

export interface WinLineResult {
  paylineIndex: number;
  symbol: SlotSymbol;
  count: number;
  multiplier: number;
  winInCents: bigint;
}

/**
 * Pick a symbol from the weighted distribution using a float in [0,1).
 */
function pickSymbol(float: number): SlotSymbol {
  let cursor = 0;
  const threshold = float * TOTAL_WEIGHT;
  for (const [sym, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    cursor += weight;
    if (threshold < cursor) return sym as SlotSymbol;
  }
  return SYMBOLS[SYMBOLS.length - 1]!;
}

/**
 * Spin the 5 reels and evaluate paylines.
 * Uses 15 floats: 5 reels × 3 rows.
 */
export function spinSlots(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betAmountInCents: bigint,
): SlotSpinResult {
  // Generate 15 floats for 5 reels × 3 rows
  const floats = generateFloats(serverSeed, clientSeed, nonce, 15);

  const reels: SlotSymbol[][] = [];
  for (let reel = 0; reel < 5; reel++) {
    const col: SlotSymbol[] = [];
    for (let row = 0; row < 3; row++) {
      col.push(pickSymbol(floats[reel * 3 + row]!));
    }
    reels.push(col);
  }

  // Count scatters across entire grid
  let scatterCount = 0;
  for (const reel of reels) {
    for (const sym of reel) {
      if (sym === '🔴') scatterCount++;
    }
  }

  const winLines: WinLineResult[] = [];
  let totalMultiplier = 0;

  // Evaluate each payline
  for (let pi = 0; pi < PAYLINES.length; pi++) {
    const line = PAYLINES[pi]!;
    const lineSymbols = line.map((row, reelIdx) => reels[reelIdx]![row]!);
    const first = lineSymbols[0]!;

    // Count consecutive matching symbols from left
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (lineSymbols[i] === first) count++;
      else break;
    }

    if (count >= 3) {
      const payout = SLOT_PAYOUTS[first];
      const multiplier = payout?.[count] ?? 0;
      if (multiplier > 0) {
        const winInCents = betAmountInCents * BigInt(multiplier);
        winLines.push({
          paylineIndex: pi,
          symbol: first,
          count,
          multiplier,
          winInCents,
        });
        totalMultiplier += multiplier;
      }
    }
  }

  const totalWinInCents = betAmountInCents * BigInt(totalMultiplier);
  const freeSpinsAwarded = FREE_SPIN_TRIGGERS[scatterCount] ?? 0;

  // Jackpot spin: all reels show 💰 on any line
  const isJackpotSpin = reels.every((reel) => reel.includes('💰'));

  return {
    reels,
    winLines,
    totalMultiplier,
    totalWinInCents,
    scatterCount,
    freeSpinsAwarded,
    isJackpotSpin,
  };
}

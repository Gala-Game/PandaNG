/**
 * Treasure Hunt engine — Panda Treasure Hunt
 * A 5×4 pick-em grid where the player picks N tiles.
 * Each tile hides either treasure (multiplier) or a bomb (bust).
 */

import { generateFloats } from './rng';

export interface TreasureTile {
  index: number;
  type: 'treasure' | 'bomb';
  multiplier: number; // only meaningful for treasure tiles
}

export interface TreasureHuntResult {
  grid: TreasureTile[];   // full grid (20 tiles) — revealed after game ends
  pickedIndices: number[]; // the tiles the player picked
  revealedTiles: TreasureTile[];
  isBlown: boolean;        // hit a bomb
  totalMultiplier: number;
  winAmountInCents: bigint;
}

const GRID_SIZE = 20; // 5×4
const BOMB_COUNT = 4;

// Multiplier schedule for progressive picks (increases with each safe pick)
const PICK_MULTIPLIERS = [
  1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.75, 4.5, 5.5,
  7.0, 9.0, 12.0, 16.0, 21.0, 28.0,
];

export function generateTreasureGrid(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): TreasureTile[] {
  const floats = generateFloats(serverSeed, clientSeed, nonce, GRID_SIZE);

  // Determine bomb positions: the BOMB_COUNT tiles with the lowest floats
  const indexed = floats.map((f, i) => ({ f, i }));
  indexed.sort((a, b) => a.f - b.f);
  const bombIndices = new Set(indexed.slice(0, BOMB_COUNT).map((x) => x.i));

  return Array.from({ length: GRID_SIZE }, (_, i) => ({
    index: i,
    type: bombIndices.has(i) ? 'bomb' : 'treasure',
    multiplier: 0, // assigned during pick resolution
  }));
}

export function resolveTreasureHunt(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betAmountInCents: bigint,
  pickedIndices: number[],
): TreasureHuntResult {
  const grid = generateTreasureGrid(serverSeed, clientSeed, nonce);

  let isBlown = false;
  let totalMultiplier = 1.0;
  const revealedTiles: TreasureTile[] = [];

  for (let i = 0; i < pickedIndices.length; i++) {
    const idx = pickedIndices[i]!;
    const tile = grid[idx]!;

    if (tile.type === 'bomb') {
      isBlown = true;
      revealedTiles.push(tile);
      break;
    }

    const multiplier = PICK_MULTIPLIERS[i] ?? PICK_MULTIPLIERS[PICK_MULTIPLIERS.length - 1]!;
    const revealed: TreasureTile = { ...tile, multiplier };
    revealedTiles.push(revealed);
    totalMultiplier = multiplier;
  }

  const winAmountInCents = isBlown
    ? 0n
    : (betAmountInCents * BigInt(Math.floor(totalMultiplier * 100))) / 100n;

  return {
    grid,
    pickedIndices,
    revealedTiles,
    isBlown,
    totalMultiplier: isBlown ? 0 : totalMultiplier,
    winAmountInCents,
  };
}

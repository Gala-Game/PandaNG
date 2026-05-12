/**
 * Spin Wheel engine — Panda Spin Wheel
 * Configurable segments with multipliers.
 */

import { generateFloat } from './rng';

export interface WheelSegment {
  label: string;
  multiplier: number;
  color: string;
  weight: number; // relative probability weight
}

export const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '0×',   multiplier: 0,    color: '#1a1a2e', weight: 30 },
  { label: '1.5×', multiplier: 1.5,  color: '#16213e', weight: 25 },
  { label: '2×',   multiplier: 2,    color: '#0f3460', weight: 20 },
  { label: '3×',   multiplier: 3,    color: '#533483', weight: 12 },
  { label: '5×',   multiplier: 5,    color: '#00FFFF', weight: 8  },
  { label: '10×',  multiplier: 10,   color: '#FF007F', weight: 4  },
  { label: '20×',  multiplier: 20,   color: '#FFD700', weight: 1  },
];

export interface WheelSpinResult {
  segmentIndex: number;
  segment: WheelSegment;
  winAmountInCents: bigint;
}

export function spinWheel(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betAmountInCents: bigint,
  segments: WheelSegment[] = DEFAULT_WHEEL_SEGMENTS,
): WheelSpinResult {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  const float = generateFloat(serverSeed, clientSeed, nonce);
  const threshold = float * totalWeight;

  let cursor = 0;
  let segmentIndex = segments.length - 1;
  for (let i = 0; i < segments.length; i++) {
    cursor += segments[i]!.weight;
    if (threshold < cursor) {
      segmentIndex = i;
      break;
    }
  }

  const segment = segments[segmentIndex]!;
  const multiplierBps = BigInt(Math.floor(segment.multiplier * 100));
  const winAmountInCents = (betAmountInCents * multiplierBps) / 100n;

  return { segmentIndex, segment, winAmountInCents };
}

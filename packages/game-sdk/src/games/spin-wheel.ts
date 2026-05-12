import { generateFloat } from '../rng/provably-fair';

export const WHEEL_SEGMENTS = [
  { label: '0x',   multiplier: 0,   color: '#1a1a2e', probability: 0.35  },
  { label: '1x',   multiplier: 1,   color: '#16213e', probability: 0.25  },
  { label: '1.5x', multiplier: 1.5, color: '#0f3460', probability: 0.15  },
  { label: '2x',   multiplier: 2,   color: '#533483', probability: 0.10  },
  { label: '3x',   multiplier: 3,   color: '#00FFFF', probability: 0.07  },
  { label: '5x',   multiplier: 5,   color: '#FF007F', probability: 0.04  },
  { label: '10x',  multiplier: 10,  color: '#FFD700', probability: 0.025 },
  { label: '50x',  multiplier: 50,  color: '#FF4500', probability: 0.010 },
  { label: '100x', multiplier: 100, color: '#00FF00', probability: 0.005 },
] as const;

export type WheelSegment = (typeof WHEEL_SEGMENTS)[number];

/** Spin the wheel using cumulative probability distribution */
export function spinWheel(serverSeed: string, clientSeed: string, nonce: number): WheelSegment {
  const float = generateFloat(serverSeed, clientSeed, nonce);
  let cumulative = 0;
  for (const segment of WHEEL_SEGMENTS) {
    cumulative += segment.probability;
    if (float < cumulative) return segment;
  }
  return WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1] as WheelSegment;
}

export interface WheelResult {
  segmentIndex: number;
  segment: WheelSegment;
  winInCents: bigint;
  netChangeInCents: bigint;
}

export function getWheelResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  betInCents: bigint,
): WheelResult {
  const segment = spinWheel(serverSeed, clientSeed, nonce);
  const segmentIndex = WHEEL_SEGMENTS.indexOf(segment as typeof WHEEL_SEGMENTS[number]);
  const winInCents = BigInt(Math.floor(Number(betInCents) * segment.multiplier));
  const netChangeInCents = winInCents - betInCents;

  return { segmentIndex, segment, winInCents, netChangeInCents };
}

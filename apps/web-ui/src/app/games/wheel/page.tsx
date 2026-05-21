'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BetControls, WinDisplay } from '@/components/game/BetControls';
import { startGameSession, resolveWheel } from '@/lib/api';
import { useWalletStore } from '@/store';

const SEGMENTS = [
  { label: '0×',   multiplier: 0,    color: '#1a1a2e', weight: 30, bg: 'bg-gray-900'   },
  { label: '1.5×', multiplier: 1.5,  color: '#16213e', weight: 25, bg: 'bg-slate-900'  },
  { label: '2×',   multiplier: 2,    color: '#0f3460', weight: 20, bg: 'bg-blue-950'   },
  { label: '3×',   multiplier: 3,    color: '#533483', weight: 12, bg: 'bg-purple-950' },
  { label: '5×',   multiplier: 5,    color: '#00FFFF', weight: 8,  bg: 'bg-cyan-600'   },
  { label: '10×',  multiplier: 10,   color: '#FF007F', weight: 4,  bg: 'bg-pink-600'   },
  { label: '20×',  multiplier: 20,   color: '#FFD700', weight: 1,  bg: 'bg-yellow-500' },
];

const TOTAL_WEIGHT = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
const SEGMENT_ANGLES = SEGMENTS.map((seg) => (seg.weight / TOTAL_WEIGHT) * 360);

function getSegmentAngle(idx: number): number {
  return SEGMENT_ANGLES.slice(0, idx).reduce((s, a) => s + a, 0);
}

export default function WheelPage() {
  const { decrementBalance, incrementBalance } = useWalletStore();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landedSegment, setLandedSegment] = useState<(typeof SEGMENTS)[0] | null>(null);
  const [result, setResult] = useState<{ winAmountInCents: string } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spinWheel = useCallback(async (betAmountInCents: number) => {
    if (spinning) return;
    setSpinning(true);
    setLandedSegment(null);
    setError(null);

    try {
      decrementBalance(BigInt(betAmountInCents));
      const session = await startGameSession('PANDA_SPIN', betAmountInCents);
      setSessionId(session.sessionId);

      const outcome = await resolveWheel(session.sessionId);
      const segIdx = outcome.segmentIndex as number;

      // Spin to the landed segment
      const segMidAngle = getSegmentAngle(segIdx) + SEGMENT_ANGLES[segIdx] / 2;
      const spinDegrees = 360 * 8 + (360 - segMidAngle);
      setRotation((prev) => prev + spinDegrees);

      setTimeout(() => {
        const seg = SEGMENTS[segIdx];
        setLandedSegment(seg);
        const win = BigInt(outcome.winAmountInCents as string);
        if (win > 0n) incrementBalance(win);
        setResult({ winAmountInCents: outcome.winAmountInCents as string });
        setShowWin(true);
        setSpinning(false);
      }, 4500);
    } catch (err) {
      setSpinning(false);
      const message = err instanceof Error ? err.message : 'Spin failed';
      setError(message);
      incrementBalance(BigInt(betAmountInCents));
    }
  }, [spinning, decrementBalance, incrementBalance]);

  // Build SVG pie chart
  const cx = 150;
  const cy = 150;
  const r = 140;
  let currentAngle = -90; // start at top

  const paths = SEGMENTS.map((seg) => {
    const startAngle = currentAngle;
    const sweepAngle = (seg.weight / TOTAL_WEIGHT) * 360;
    const endAngle = startAngle + sweepAngle;
    const start = {
      x: cx + r * Math.cos((startAngle * Math.PI) / 180),
      y: cy + r * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: cx + r * Math.cos((endAngle * Math.PI) / 180),
      y: cy + r * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArc = sweepAngle > 180 ? 1 : 0;
    const midAngle = startAngle + sweepAngle / 2;
    const textR = r * 0.65;
    const text = {
      x: cx + textR * Math.cos((midAngle * Math.PI) / 180),
      y: cy + textR * Math.sin((midAngle * Math.PI) / 180),
    };
    currentAngle = endAngle;

    return { seg, start, end, largeArc, text, midAngle };
  });

  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games" className="text-neon-cyan/60 hover:text-neon-cyan font-heading text-sm">
            ← Games
          </Link>
          <h1 className="font-heading text-2xl font-bold neon-text-cyan">🎡 PANDA SPIN WHEEL</h1>
          {sessionId && (
            <Link href={`/verify?session=${sessionId}`} className="text-xs text-neon-cyan/40">Verify ↗</Link>
          )}
        </div>

        {/* Wheel */}
        <div className="glass-card p-6 flex flex-col items-center gap-4 border-neon-cyan/20">
          <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px]
                              border-l-transparent border-r-transparent border-t-gold
                              drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
            </div>

            <motion.svg
              width="300"
              height="300"
              viewBox="0 0 300 300"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.17, 0.67, 0.29, 1.0] }}
              style={{ originX: '50%', originY: '50%' }}
            >
              {paths.map(({ seg, start, end, largeArc, text }) => (
                <g key={seg.label}>
                  <path
                    d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                    fill={seg.color}
                    stroke="#0a0a0f"
                    strokeWidth="1"
                  />
                  <text
                    x={text.x}
                    y={text.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="13"
                    fontFamily="Rajdhani, sans-serif"
                    fontWeight="bold"
                  >
                    {seg.label}
                  </text>
                </g>
              ))}
              {/* Center circle */}
              <circle cx={cx} cy={cy} r={20} fill="#0a0a0f" stroke="#00FFFF" strokeWidth="2" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#00FFFF" fontSize="14">
                🐼
              </text>
            </motion.svg>
          </div>

          {landedSegment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-center"
            >
              <span className="text-panda-white/60 text-sm">Landed on: </span>
              <span className="text-gold font-bold text-xl">{landedSegment.label}</span>
            </motion.div>
          )}
        </div>

        {/* Segment odds */}
        <div className="glass-card p-4 grid grid-cols-4 gap-2 border-dark-border">
          {SEGMENTS.map((seg) => (
            <div key={seg.label} className="text-center rounded-lg p-2" style={{ backgroundColor: `${seg.color}40` }}>
              <div className="font-heading font-bold text-sm" style={{ color: seg.multiplier >= 5 ? seg.color : '#F8F8F8' }}>
                {seg.label}
              </div>
              <div className="text-xs text-panda-white/40 font-heading">
                {((seg.weight / TOTAL_WEIGHT) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>

        {error && <div className="text-neon-pink/80 text-sm text-center font-heading">{error}</div>}

        <BetControls minBet={100} maxBet={500000} onBet={spinWheel} disabled={spinning} loading={spinning} />
      </div>

      {showWin && result && (
        <WinDisplay winAmountInCents={result.winAmountInCents} onClose={() => setShowWin(false)} />
      )}
    </main>
  );
}

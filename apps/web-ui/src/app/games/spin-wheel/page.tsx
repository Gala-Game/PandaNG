'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { gameApi } from '@/lib/api';
import { useWalletStore, formatPHP } from '@/store/wallet.store';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

const SEGMENTS = [
  { label: '0×', multiplier: 0, color: '#1a1a2e' },
  { label: '1×', multiplier: 1, color: '#16213e' },
  { label: '1.5×', multiplier: 1.5, color: '#0f3460' },
  { label: '2×', multiplier: 2, color: '#533483' },
  { label: '3×', multiplier: 3, color: '#007ACC' },
  { label: '5×', multiplier: 5, color: '#FF007F' },
  { label: '10×', multiplier: 10, color: '#FFD700' },
  { label: '50×', multiplier: 50, color: '#FF4500' },
  { label: '100×', multiplier: 100, color: '#00FF00' },
];
const SLICE = 360 / SEGMENTS.length;

function Wheel({ rotation }: { rotation: number }) {
  const cx = 100, cy = 100, r = 90;
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[280px]">
      {SEGMENTS.map((seg, i) => {
        const startAngle = i * SLICE - 90;
        const endAngle = startAngle + SLICE;
        const s = (a: number) => ({ x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180) });
        const start = s(startAngle), end = s(endAngle);
        const mid = s(startAngle + SLICE / 2);
        const d = `M${cx},${cy} L${start.x},${start.y} A${r},${r} 0 0,1 ${end.x},${end.y} Z`;
        return (
          <g key={i} style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px' }}>
            <path d={d} fill={seg.color} stroke="#000" strokeWidth="1" />
            <text x={cx + (r * 0.65) * Math.cos(((startAngle + SLICE / 2) * Math.PI) / 180)} y={cy + (r * 0.65) * Math.sin(((startAngle + SLICE / 2) * Math.PI) / 180)} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="bold">
              {seg.label}
            </text>
          </g>
        );
      })}
      {/* Pointer */}
      <polygon points="100,5 95,18 105,18" fill="#FFD700" />
    </svg>
  );
}

export default function SpinWheelPage() {
  const { isAuthenticated } = useAuthStore();
  const { balanceInCents, subtractBet, addWin, fetchBalance } = useWalletStore();
  const [betCents, setBetCents] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ segmentIndex: number; segment: { label: string; multiplier: number }; winInCents: string } | null>(null);
  const [error, setError] = useState('');
  const normalizedBetCents = Number.isSafeInteger(betCents) ? betCents : 0;

  const spin = useCallback(async () => {
    if (spinning || !isAuthenticated) return;
    const safeBetCents = Number.isSafeInteger(betCents) ? betCents : NaN;
    if (!Number.isInteger(safeBetCents) || safeBetCents < 10) {
      setError('Bet must be a whole number of cents');
      return;
    }
    if (BigInt(safeBetCents) > balanceInCents) { setError('Insufficient balance'); return; }
    setError('');
    setSpinning(true);
    setResult(null);

    try {
      const session = await gameApi.startSession({ gameType: 'PANDA_SPIN', betAmountInCents: safeBetCents });
      subtractBet(BigInt(safeBetCents));

      // Pre-animate for 2s
      const extraSpins = 5 * 360 + Math.random() * 360;
      setRotation((r) => r + extraSpins);

      await new Promise((res) => setTimeout(res, 2000));

      const res = await gameApi.resolveSession(session.sessionId, {});
      const r = res.result as typeof result;
      setResult(r);

      // Snap to actual segment
      if (r) {
        setRotation(360 - r.segmentIndex * SLICE);
      }

      if (r && BigInt(r.winInCents) > 0n) addWin(BigInt(r.winInCents));
      await fetchBalance();
    } catch {
      setError('Failed to spin. Please try again.');
    } finally {
      setSpinning(false);
    }
  }, [spinning, isAuthenticated, betCents, balanceInCents, subtractBet, addWin, fetchBalance]);

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="mb-4 text-4xl">🎡</div>
          <h2 className="font-heading text-2xl font-bold">LOGIN TO PLAY</h2>
          <Link href="/login" className="mt-4 block"><CyberButton variant="primary">Login / Register</CyberButton></Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-deep-black px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-4xl font-black text-neon-cyan">🎡 PANDA SPIN WHEEL</h1>
          <p className="mt-1 text-sm text-gray-400">9 segments • Up to 100×</p>
        </div>

        <GlassCard glow="cyan" className="mb-6 flex flex-col items-center py-8 px-4">
          <motion.div
            animate={spinning ? { rotate: [0, 360] } : {}}
            transition={spinning ? { repeat: Infinity, duration: 0.3, ease: 'linear' } : {}}
          >
            <Wheel rotation={rotation} />
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center"
              >
                <div className="font-heading text-2xl font-black">
                  {result.segment.multiplier > 0 ? (
                    <span className="text-gold">🏆 {result.segment.label} — Won {formatPHP(BigInt(result.winInCents))}!</span>
                  ) : (
                    <span className="text-gray-400">0× — No win this time</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <GlassCard className="mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Balance</span>
            <span className="font-heading font-bold text-neon-cyan">{formatPHP(balanceInCents)}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              step={1}
              value={betCents}
              onChange={(e) => setBetCents(Number(e.target.value))}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              placeholder="Bet (cents)"
            />
            <span className="text-sm text-gray-400">{formatPHP(BigInt(normalizedBetCents))}</span>
          </div>
        </GlassCard>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <CyberButton variant="primary" size="lg" className="w-full" isLoading={spinning} onClick={spin}>
          🎡 SPIN WHEEL
        </CyberButton>
      </div>
    </main>
  );
}

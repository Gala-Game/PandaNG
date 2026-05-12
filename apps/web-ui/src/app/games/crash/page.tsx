'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { gameApi } from '@/lib/api';
import { useWalletStore, formatPHP } from '@/store/wallet.store';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

const HISTORY_PRESETS = [1.02, 1.45, 3.21, 6.80, 1.01, 15.23, 2.44, 1.02, 88.0, 1.01];

function chipColor(v: number) {
  if (v < 2) return 'bg-gray-700 text-gray-300';
  if (v < 5) return 'bg-blue-900/60 text-blue-300';
  if (v < 10) return 'bg-purple-900/60 text-purple-300';
  if (v < 50) return 'bg-green-900/60 text-green-300';
  return 'bg-gold/20 text-gold';
}

export default function CrashPage() {
  const { isAuthenticated } = useAuthStore();
  const { balanceInCents, subtractBet, addWin, fetchBalance } = useWalletStore();

  const [betCents, setBetCents] = useState(100);
  const [phase, setPhase] = useState<'idle' | 'running' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState(HISTORY_PRESETS);
  const [result, setResult] = useState<{ cashedOut: boolean; multiplier: number; crashPoint: number; winInCents: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Animate multiplier while running
  useEffect(() => {
    if (phase === 'running') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // exponential growth: e^(0.00006 * ms)
        setMultiplier(Math.round(Math.pow(Math.E, 0.06 * elapsed) * 100) / 100);
      }, 50);
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [phase, stopTimer]);

  const placeBet = useCallback(async () => {
    if (!isAuthenticated || loading) return;
    if (BigInt(betCents) > balanceInCents) { setError('Insufficient balance'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setMultiplier(1.0);
    try {
      const session = await gameApi.startSession({ gameType: 'CRASH', betAmountInCents: betCents });
      setSessionId(session.sessionId);
      subtractBet(BigInt(betCents));
      setPhase('running');
    } catch {
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loading, betCents, balanceInCents, subtractBet]);

  const cashOut = useCallback(async () => {
    if (!sessionId || phase !== 'running') return;
    setPhase('idle');
    try {
      const res = await gameApi.resolveSession(sessionId, { cashOutAt: multiplier });
      const r = res.result as typeof result;
      setResult(r);
      setHistory((h) => [multiplier, ...h.slice(0, 9)]);
      if (r && BigInt(r.winInCents) > 0n) addWin(BigInt(r.winInCents));
      await fetchBalance();
    } catch {
      setError('Failed to cash out');
    }
    setSessionId(null);
  }, [sessionId, phase, multiplier, addWin, fetchBalance]);

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="mb-4 text-4xl">🚀</div>
          <h2 className="font-heading text-2xl font-bold">LOGIN TO PLAY</h2>
          <Link href="/login" className="mt-4 block"><CyberButton variant="primary">Login / Register</CyberButton></Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-deep-black px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 text-center">
          <h1 className="font-heading text-4xl font-black text-neon-pink">🚀 PANDA CRASH</h1>
        </div>

        {/* History */}
        <div className="mb-4 flex flex-wrap gap-2">
          {history.map((v, i) => (
            <span key={i} className={`rounded-full px-2 py-0.5 text-xs font-bold ${chipColor(v)}`}>
              {v.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Multiplier display */}
        <GlassCard glow="pink" className="mb-6 flex items-center justify-center py-16">
          <motion.div
            key={phase}
            className={`font-heading text-7xl font-black ${phase === 'crashed' ? 'text-red-500' : 'text-green-400'}`}
            animate={phase === 'running' ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            {multiplier.toFixed(2)}×
          </motion.div>
        </GlassCard>

        {/* Win/loss result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 rounded-xl p-4 text-center font-heading ${
                result.cashedOut ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'
              }`}
            >
              {result.cashedOut ? (
                <><div className="text-2xl font-black text-green-400">✅ CASHED OUT at {result.multiplier}×</div>
                <div className="text-lg text-gold">Won {formatPHP(BigInt(result.winInCents))}</div></>
              ) : (
                <><div className="text-2xl font-black text-red-400">💥 CRASHED at {result.crashPoint}×</div>
                <div className="text-gray-400">Better luck next time!</div></>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance + bet */}
        <GlassCard className="mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Balance</span>
            <span className="font-heading font-bold text-neon-cyan">{formatPHP(balanceInCents)}</span>
          </div>
          <input
            type="number"
            min={10}
            value={betCents}
            onChange={(e) => setBetCents(Number(e.target.value))}
            disabled={phase === 'running'}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-50"
            placeholder="Bet (cents)"
          />
        </GlassCard>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {phase === 'idle' ? (
          <CyberButton variant="danger" size="lg" className="w-full" isLoading={loading} onClick={placeBet}>
            🚀 PLACE BET
          </CyberButton>
        ) : (
          <CyberButton variant="gold" size="lg" className="w-full text-xl" onClick={cashOut}>
            💰 CASH OUT {multiplier.toFixed(2)}×
          </CyberButton>
        )}
      </div>
    </main>
  );
}

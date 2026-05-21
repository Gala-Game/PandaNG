'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { gameApi } from '@/lib/api';
import { useWalletStore, formatPHP } from '@/store/wallet.store';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

function calcPayout(target: number, isOver: boolean) {
  const chance = isOver ? 100 - target : target;
  if (chance <= 0) return 9900;
  return Math.min(Math.round((98 / chance) * 100) / 100, 9900);
}

export default function DicePage() {
  const { isAuthenticated } = useAuthStore();
  const { balanceInCents, subtractBet, addWin, fetchBalance } = useWalletStore();
  const [betCents, setBetCents] = useState(100);
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [winAmount, setWinAmount] = useState<bigint>(0n);
  const [error, setError] = useState('');
  const normalizedBetCents = Number.isSafeInteger(betCents) ? betCents : 0;

  const payout = calcPayout(target, isOver);
  const chance = isOver ? 100 - target : target;

  const bet = useCallback(async () => {
    if (spinning || !isAuthenticated) return;
    const safeBetCents = Number.isSafeInteger(betCents) ? betCents : NaN;
    if (!Number.isInteger(safeBetCents) || safeBetCents < 10) {
      setError('Bet must be a whole number of cents');
      return;
    }
    if (BigInt(safeBetCents) > balanceInCents) { setError('Insufficient balance'); return; }
    setError('');
    setSpinning(true);
    setRoll(null);
    setWon(null);

    // Animate dice
    const animInterval = setInterval(() => {
      setRoll(Math.floor(Math.random() * 100));
    }, 50);

    try {
      const session = await gameApi.startSession({ gameType: 'DRAGON_DICE', betAmountInCents: safeBetCents });
      subtractBet(BigInt(safeBetCents));
      await new Promise((r) => setTimeout(r, 800));
      clearInterval(animInterval);
      const res = await gameApi.resolveSession(session.sessionId, { target, isOver });
      const r = res.result as { roll: number; won: boolean; winInCents: string };
      setRoll(r.roll);
      setWon(r.won);
      const win = BigInt(r.winInCents);
      setWinAmount(win);
      if (win > 0n) addWin(win);
      await fetchBalance();
    } catch {
      clearInterval(animInterval);
      setError('Failed to roll. Please try again.');
    } finally {
      setSpinning(false);
    }
  }, [spinning, isAuthenticated, betCents, balanceInCents, target, isOver, subtractBet, addWin, fetchBalance]);

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="mb-4 text-4xl">🎲</div>
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
          <h1 className="font-heading text-4xl font-black text-neon-cyan">🎲 DRAGON DICE</h1>
          <p className="mt-1 text-sm text-gray-400">Provably fair • Up to 9900×</p>
        </div>

        {/* Roll display */}
        <GlassCard glow="cyan" className="mb-6 flex flex-col items-center justify-center py-12">
          <motion.div
            className={`font-heading text-8xl font-black ${won === true ? 'text-green-400' : won === false ? 'text-red-400' : 'text-white'}`}
            animate={spinning ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
          >
            {roll !== null ? roll.toFixed(2) : '—'}
          </motion.div>

          <AnimatePresence>
            {won !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 font-heading text-xl font-bold"
              >
                {won ? (
                  <span className="text-green-400">WIN! {formatPHP(winAmount)}</span>
                ) : (
                  <span className="text-red-400">LOSE</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Controls */}
        <GlassCard className="mb-4 p-4 space-y-4">
          {/* Over / Under toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setIsOver(false)}
              className={`flex-1 py-2 font-heading text-sm font-bold transition-colors ${!isOver ? 'bg-neon-cyan text-black' : 'text-gray-400 hover:bg-white/5'}`}
            >
              UNDER {target}
            </button>
            <button
              onClick={() => setIsOver(true)}
              className={`flex-1 py-2 font-heading text-sm font-bold transition-colors ${isOver ? 'bg-neon-cyan text-black' : 'text-gray-400 hover:bg-white/5'}`}
            >
              OVER {target}
            </button>
          </div>

          {/* Target slider */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Target: {target}</span>
              <span>Win Chance: {chance.toFixed(0)}%</span>
              <span>Payout: {payout}×</span>
            </div>
            <input
              type="range"
              min={2}
              max={98}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-neon-cyan"
            />
          </div>

          {/* Bet */}
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

        <CyberButton variant="primary" size="lg" className="w-full" isLoading={spinning} onClick={bet}>
          🎲 ROLL DICE
        </CyberButton>
      </div>
    </main>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BetControls, WinDisplay } from '@/components/game/BetControls';
import { startGameSession, resolveDice } from '@/lib/api';
import { useWalletStore } from '@/store';

function getDiceMultiplier(target: number, mode: 'over' | 'under'): number {
  const winChance = mode === 'over' ? (100 - target) / 100 : (target - 1) / 100;
  if (winChance <= 0) return 0;
  return Math.floor(((1 - 0.01) / winChance) * 10000) / 10000;
}

function getWinChance(target: number, mode: 'over' | 'under'): number {
  return mode === 'over' ? ((100 - target) / 100) * 100 : ((target - 1) / 100) * 100;
}

export default function DicePage() {
  const { decrementBalance, incrementBalance } = useWalletStore();
  const [target, setTarget] = useState(50);
  const [mode, setMode] = useState<'over' | 'under'>('over');
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<{ winAmountInCents: string } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rollDice = useCallback(async (betAmountInCents: number) => {
    if (rolling) return;
    setRolling(true);
    setRoll(null);
    setError(null);

    try {
      decrementBalance(BigInt(betAmountInCents));
      const session = await startGameSession('DRAGON_DICE', betAmountInCents);
      setSessionId(session.sessionId);

      // Animate counting
      let ticks = 0;
      const anim = setInterval(() => {
        setRoll(Math.floor(Math.random() * 100) + 1);
        if (++ticks > 15) clearInterval(anim);
      }, 60);

      const outcome = await resolveDice(session.sessionId, target, mode);
      clearInterval(anim);
      setRoll(outcome.roll as number);

      const win = BigInt(outcome.winAmountInCents as string);
      if (win > 0n) incrementBalance(win);

      setResult({ winAmountInCents: outcome.winAmountInCents as string });
      setShowWin(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Roll failed';
      setError(message);
      incrementBalance(BigInt(betAmountInCents));
    } finally {
      setRolling(false);
    }
  }, [rolling, target, mode, decrementBalance, incrementBalance]);

  const multiplier = getDiceMultiplier(target, mode);
  const winChance = getWinChance(target, mode);
  const isWin = roll !== null && (mode === 'over' ? roll > target : roll < target);

  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games" className="text-neon-cyan/60 hover:text-neon-cyan font-heading text-sm">
            ← Games
          </Link>
          <h1 className="font-heading text-2xl font-bold neon-text-cyan">🎲 PANDA DICE</h1>
          {sessionId && (
            <Link href={`/verify?session=${sessionId}`} className="text-xs text-neon-cyan/40">Verify ↗</Link>
          )}
        </div>

        {/* Dice Display */}
        <div className="glass-card p-8 text-center border-neon-cyan/20">
          <AnimatePresence mode="wait">
            {roll !== null ? (
              <motion.div
                key={roll}
                initial={{ scale: 0.5, rotateY: 90, opacity: 0 }}
                animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="space-y-2"
              >
                <div
                  className={`text-8xl font-heading font-bold tabular-nums mx-auto w-36 h-36
                              flex items-center justify-center rounded-2xl border-2 shadow-lg
                              ${isWin
                                ? 'border-gold neon-text-gold'
                                : 'border-neon-pink/60 text-neon-pink'}`}
                >
                  {roll}
                </div>
                <div className={`font-heading font-bold text-lg ${isWin ? 'neon-text-gold' : 'text-neon-pink'}`}>
                  {isWin ? '✓ WIN!' : '✗ LOSE'}
                </div>
                <div className="text-panda-white/40 text-sm font-heading">
                  Roll: {roll} {mode === 'over' ? '>' : '<'} Target: {target}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                className="w-36 h-36 mx-auto border-2 border-dark-border rounded-2xl
                           flex items-center justify-center"
              >
                <span className="text-6xl">🎲</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Target Control */}
        <div className="glass-card p-6 space-y-4 border-dark-border">
          <div className="flex gap-3">
            {(['over', 'under'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl font-heading font-bold uppercase tracking-wider transition-all ${
                  mode === m
                    ? 'bg-neon-cyan text-deep-black shadow-neon-cyan'
                    : 'bg-dark-card border border-dark-border text-panda-white/60 hover:border-neon-cyan/30'
                }`}
              >
                Roll {m}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-heading text-sm">
              <span className="text-panda-white/60">Target</span>
              <span className="text-neon-cyan font-bold">{target}</span>
            </div>
            <input
              type="range"
              min={2}
              max={98}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-neon-cyan"
              disabled={rolling}
            />
            <div className="flex justify-between text-xs text-panda-white/40 font-heading">
              <span>2</span>
              <span>98</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-dark-card/60 rounded-xl p-3">
              <div className="text-panda-white/40 text-xs font-heading uppercase tracking-wider">Payout</div>
              <div className="text-gold font-heading font-bold text-lg">{multiplier.toFixed(4)}×</div>
            </div>
            <div className="bg-dark-card/60 rounded-xl p-3">
              <div className="text-panda-white/40 text-xs font-heading uppercase tracking-wider">Win Chance</div>
              <div className="text-neon-cyan font-heading font-bold text-lg">{winChance.toFixed(1)}%</div>
            </div>
            <div className="bg-dark-card/60 rounded-xl p-3">
              <div className="text-panda-white/40 text-xs font-heading uppercase tracking-wider">House Edge</div>
              <div className="text-panda-white/60 font-heading text-lg">1%</div>
            </div>
          </div>
        </div>

        {error && <div className="text-neon-pink/80 text-sm text-center font-heading">{error}</div>}

        <BetControls
          minBet={100}
          maxBet={500000}
          onBet={rollDice}
          disabled={rolling}
          loading={rolling}
        />
      </div>

      {showWin && result && (
        <WinDisplay
          winAmountInCents={result.winAmountInCents}
          multiplier={multiplier}
          onClose={() => setShowWin(false)}
        />
      )}
    </main>
  );
}

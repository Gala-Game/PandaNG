'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BetControls, WinDisplay, formatPHP } from '@/components/game/BetControls';
import { startGameSession, resolveCrash } from '@/lib/api';
import { useWalletStore } from '@/store';

interface CrashRound {
  crashPoint: number;
  cashout: number | null;
  win: string;
  timestamp: number;
}

const TICK_INTERVAL_MS = 100;

export default function CrashPage() {
  const { decrementBalance, incrementBalance } = useWalletStore();
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState<'waiting' | 'in-flight' | 'crashed' | 'cashed-out'>('waiting');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [history, setHistory] = useState<CrashRound[]>([]);
  const [result, setResult] = useState<{ winAmountInCents: string; multiplier?: number } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const crashPointRef = useRef<number>(0);
  const multiplierRef = useRef<number>(1.0);

  const stopTicking = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const cashOut = useCallback(async () => {
    if (phase !== 'in-flight' || !currentSessionId) return;
    const cashoutAt = multiplierRef.current;
    stopTicking();
    setPhase('cashed-out');

    try {
      const outcome = await resolveCrash(currentSessionId, cashoutAt);
      const win = BigInt(outcome.winAmountInCents as string);
      if (win > 0n) incrementBalance(win);

      setHistory((prev) => [
        {
          crashPoint: outcome.crashPoint as number,
          cashout: cashoutAt,
          win: outcome.winAmountInCents as string,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 19),
      ]);

      setResult({ winAmountInCents: outcome.winAmountInCents as string, multiplier: cashoutAt });
      setShowWin(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cashout failed';
      setError(message);
    }
    setPhase('waiting');
  }, [phase, currentSessionId, stopTicking, incrementBalance]);

  const startRound = useCallback(async (betAmountInCents: number) => {
    if (phase !== 'waiting') return;
    setError(null);
    setCurrentBet(betAmountInCents);
    setPhase('in-flight');
    multiplierRef.current = 1.0;
    setMultiplier(1.0);

    try {
      decrementBalance(BigInt(betAmountInCents));
      const session = await startGameSession('CRASH', betAmountInCents);
      setCurrentSessionId(session.sessionId);

      // Tick the multiplier upward
      tickRef.current = setInterval(() => {
        multiplierRef.current = parseFloat((multiplierRef.current + 0.01).toFixed(2));
        setMultiplier(multiplierRef.current);

        // Auto-resolve if client reached absurd multiplier (server will have crashed earlier)
        if (multiplierRef.current >= 100) {
          stopTicking();
          void cashOut();
        }
      }, TICK_INTERVAL_MS);
    } catch (err) {
      stopTicking();
      setPhase('waiting');
      const message = err instanceof Error ? err.message : 'Failed to start round';
      setError(message);
      incrementBalance(BigInt(betAmountInCents));
    }
  }, [phase, decrementBalance, incrementBalance, stopTicking, cashOut]);

  useEffect(() => {
    return () => stopTicking();
  }, [stopTicking]);

  const multiplierColor =
    multiplier < 2 ? 'text-neon-cyan' :
    multiplier < 5 ? 'text-gold' :
    'text-neon-pink';

  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games" className="text-neon-cyan/60 hover:text-neon-cyan font-heading text-sm">
            ← Games
          </Link>
          <h1 className="font-heading text-2xl font-bold neon-text-cyan">🚀 PANDA CRASH</h1>
          <div />
        </div>

        {/* Main Display */}
        <div className="glass-card p-8 text-center border-neon-cyan/20 relative overflow-hidden min-h-[220px]
                        flex flex-col items-center justify-center">
          {/* Background grid animation */}
          <div className="absolute inset-0 opacity-10 bg-cyber-grid bg-[size:20px_20px] animate-pulse" />

          {phase === 'crashed' ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-2"
            >
              <div className="text-5xl">💥</div>
              <div className="font-heading text-3xl text-neon-pink font-bold">CRASHED!</div>
              <div className="font-heading text-xl text-panda-white/60">
                at {crashPointRef.current.toFixed(2)}×
              </div>
            </motion.div>
          ) : (
            <motion.div
              animate={phase === 'in-flight' ? { scale: [1, 1.02, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <div className={`font-heading text-7xl font-bold ${multiplierColor} tabular-nums`}
                   style={{ textShadow: `0 0 40px currentColor` }}>
                {multiplier.toFixed(2)}×
              </div>
              {phase === 'waiting' && (
                <div className="text-panda-white/40 font-heading text-sm mt-2">
                  Place your bet to start
                </div>
              )}
              {phase === 'in-flight' && (
                <div className="text-neon-cyan/60 font-heading text-sm mt-2 animate-pulse">
                  🚀 Flying... Cash out before it crashes!
                </div>
              )}
              {phase === 'cashed-out' && (
                <div className="text-gold font-heading text-sm mt-2">Cashed out! ✓</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Cash Out button */}
        {phase === 'in-flight' && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={cashOut}
            className="w-full py-4 rounded-xl bg-gold text-deep-black font-heading font-bold text-xl
                       shadow-neon-gold hover:scale-105 transition-transform"
          >
            💰 CASH OUT — {formatPHP(BigInt(Math.floor(currentBet * multiplier)))}
          </motion.button>
        )}

        {error && (
          <div className="text-neon-pink/80 text-sm text-center font-heading">{error}</div>
        )}

        {/* History */}
        <div className="glass-card p-4 border-dark-border">
          <h3 className="font-heading text-sm text-panda-white/50 mb-3 tracking-wider uppercase">
            Recent Rounds
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.length === 0 ? (
              <span className="text-panda-white/30 text-xs font-heading">No rounds yet</span>
            ) : (
              history.map((round, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded font-heading text-xs font-bold ${
                    round.crashPoint >= 2
                      ? round.crashPoint >= 10 ? 'bg-gold/20 text-gold' : 'bg-neon-cyan/10 text-neon-cyan'
                      : 'bg-neon-pink/10 text-neon-pink'
                  }`}
                >
                  {round.crashPoint.toFixed(2)}×
                </span>
              ))
            )}
          </div>
        </div>

        {/* Bet Controls */}
        {phase === 'waiting' && (
          <BetControls
            minBet={100}
            maxBet={500000}
            onBet={startRound}
            disabled={phase !== 'waiting'}
          />
        )}
      </div>

      {showWin && result && (
        <WinDisplay
          winAmountInCents={result.winAmountInCents}
          multiplier={result.multiplier}
          onClose={() => setShowWin(false)}
        />
      )}
    </main>
  );
}

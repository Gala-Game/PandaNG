'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BetControls, WinDisplay, formatPHP } from '@/components/game/BetControls';
import { startGameSession, resolveSlots } from '@/lib/api';
import { useWalletStore } from '@/store';

const SYMBOLS = ['🐼', '🎋', '🌕', '💎', '🌸', '🍃', '🔴', '💰'];
const REEL_COUNT = 5;
const ROW_COUNT = 3;

// Generate a random display reel for animation purposes
function randomReel(): string[] {
  return Array.from({ length: ROW_COUNT }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!);
}

type ReelState = string[][];

export default function SlotsPage() {
  const { decrementBalance, incrementBalance } = useWalletStore();
  const [reels, setReels] = useState<ReelState>(
    Array.from({ length: REEL_COUNT }, randomReel),
  );
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    winAmountInCents: string;
    winLines: Array<{ paylineIndex: number; symbol: string; count: number; multiplier: number; winInCents: string }>;
    freeSpinsAwarded: number;
    isJackpotSpin: boolean;
  } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spin = useCallback(async (betAmountInCents: number) => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setError(null);

    // Start spin animation
    spinIntervalRef.current = setInterval(() => {
      setReels(Array.from({ length: REEL_COUNT }, randomReel));
    }, 80);

    try {
      decrementBalance(BigInt(betAmountInCents));

      // Start session
      const session = await startGameSession('SLOTS', betAmountInCents);
      setSessionId(session.sessionId);

      // Resolve
      const outcome = await resolveSlots(session.sessionId);

      // Stop animation and show real reels
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

      // Animate reel reveal sequentially
      for (let r = 0; r < REEL_COUNT; r++) {
        await new Promise((res) => setTimeout(res, 150 * (r + 1)));
        setReels((prev) => {
          const next = [...prev];
          next[r] = outcome.reels[r] as string[];
          return next;
        });
      }

      const winAmount = BigInt(outcome.totalWinInCents as string);
      if (winAmount > 0n) incrementBalance(winAmount);

      setResult(outcome);
      setShowWin(true);
    } catch (err: unknown) {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      // Refund client-side balance on error
      incrementBalance(BigInt(betAmountInCents));
    } finally {
      setSpinning(false);
    }
  }, [spinning, decrementBalance, incrementBalance]);

  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games" className="text-neon-cyan/60 hover:text-neon-cyan font-heading text-sm">
            ← Games
          </Link>
          <h1 className="font-heading text-2xl font-bold neon-text-cyan">🎰 PANDA FORTUNE SLOTS</h1>
          {sessionId && (
            <Link
              href={`/verify?session=${sessionId}`}
              className="text-xs text-neon-cyan/40 hover:text-neon-cyan/60 font-heading"
            >
              Verify ↗
            </Link>
          )}
        </div>

        {/* Slot Machine */}
        <div className="glass-card p-6 border-neon-cyan/20">
          {/* Reels */}
          <div className="flex gap-2 justify-center mb-6">
            {reels.map((reel, reelIdx) => (
              <motion.div
                key={reelIdx}
                className="flex flex-col gap-1 bg-deep-black/60 rounded-xl p-2 border border-dark-border"
                animate={spinning ? { y: [0, -5, 5, -3, 3, 0] } : {}}
                transition={{ duration: 0.2, repeat: spinning ? Infinity : 0 }}
              >
                {reel.map((sym, rowIdx) => (
                  <motion.div
                    key={`${reelIdx}-${rowIdx}-${sym}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-14 h-14 flex items-center justify-center text-3xl rounded-lg
                      ${rowIdx === 1 ? 'bg-neon-cyan/5 border border-neon-cyan/20' : 'bg-dark-card/40'}`}
                  >
                    {sym}
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Win lines display */}
          {result && result.winLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 space-y-1"
            >
              {result.winLines.slice(0, 5).map((line, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-heading px-2">
                  <span className="text-neon-cyan/60">Line {line.paylineIndex + 1}: {line.symbol}×{line.count}</span>
                  <span className="text-gold">{line.multiplier}× — {formatPHP(BigInt(line.winInCents))}</span>
                </div>
              ))}
              {result.freeSpinsAwarded > 0 && (
                <div className="text-center text-neon-pink font-heading text-sm">
                  🎁 {result.freeSpinsAwarded} FREE SPINS!
                </div>
              )}
              {result.isJackpotSpin && (
                <div className="text-center neon-text-gold font-heading font-bold text-lg animate-neon-pulse">
                  💰 JACKPOT TRIGGER!
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <div className="mb-4 text-neon-pink/80 text-sm text-center font-heading">{error}</div>
          )}
        </div>

        {/* Paytable */}
        <details className="glass-card border-dark-border">
          <summary className="p-4 cursor-pointer font-heading text-panda-white/70 text-sm">
            📋 Paytable
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-xs font-heading">
            {[
              { sym: '💰', name: 'JACKPOT', x3: 50, x4: 200, x5: 1000 },
              { sym: '💎', name: 'Diamond',  x3: 20, x4: 80,  x5: 400  },
              { sym: '🐼', name: 'Panda',    x3: 10, x4: 40,  x5: 200  },
              { sym: '🌕', name: 'Moon',     x3: 6,  x4: 20,  x5: 80   },
              { sym: '🌸', name: 'Blossom',  x3: 4,  x4: 12,  x5: 50   },
              { sym: '🎋', name: 'Bamboo',   x3: 3,  x4: 8,   x5: 30   },
            ].map(({ sym, name, x3, x4, x5 }) => (
              <div key={sym} className="flex items-center gap-2 bg-dark-card/40 rounded-lg p-2">
                <span className="text-2xl">{sym}</span>
                <div>
                  <div className="text-panda-white/80">{name}</div>
                  <div className="text-neon-cyan/50">3:{x3}× | 4:{x4}× | 5:{x5}×</div>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Bet Controls */}
        <BetControls
          minBet={100}
          maxBet={100000}
          onBet={spin}
          disabled={spinning}
          loading={spinning}
        />
      </div>

      {/* Win Overlay */}
      {showWin && result && (
        <WinDisplay
          winAmountInCents={result.totalWinInCents}
          onClose={() => setShowWin(false)}
        />
      )}
    </main>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BetControls, WinDisplay, formatPHP } from '@/components/game/BetControls';
import { startGameSession, resolveTreasure } from '@/lib/api';
import { useWalletStore } from '@/store';

const GRID_SIZE = 20;
const PICK_MULTIPLIERS = [1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.75, 4.5, 5.5, 7.0];

export default function TreasurePage() {
  const { decrementBalance, incrementBalance } = useWalletStore();
  const [phase, setPhase] = useState<'idle' | 'picking' | 'resolved'>('idle');
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [revealedTiles, setRevealedTiles] = useState<Array<{ index: number; type: string; multiplier: number }>>([]);
  const [fullGrid, setFullGrid] = useState<Array<{ index: number; type: string }> | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [isBlown, setIsBlown] = useState(false);
  const [totalMultiplier, setTotalMultiplier] = useState(0);
  const [result, setResult] = useState<{ winAmountInCents: string } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startHunt = useCallback(async (betAmountInCents: number) => {
    setError(null);
    setPickedIndices([]);
    setRevealedTiles([]);
    setFullGrid(null);
    setIsBlown(false);
    setTotalMultiplier(0);
    setCurrentBet(betAmountInCents);
    setLoading(true);

    try {
      decrementBalance(BigInt(betAmountInCents));
      const session = await startGameSession('MINI_GAME', betAmountInCents);
      setSessionId(session.sessionId);
      setPhase('picking');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start';
      setError(message);
      incrementBalance(BigInt(betAmountInCents));
    } finally {
      setLoading(false);
    }
  }, [decrementBalance, incrementBalance]);

  const pickTile = useCallback(async (tileIndex: number) => {
    if (phase !== 'picking' || !sessionId) return;
    if (pickedIndices.includes(tileIndex)) return;

    const newPicked = [...pickedIndices, tileIndex];
    setPickedIndices(newPicked);
    setLoading(true);

    try {
      const outcome = await resolveTreasure(sessionId, newPicked);

      setRevealedTiles(outcome.revealedTiles);
      setIsBlown(outcome.isBlown as boolean);
      setTotalMultiplier(outcome.totalMultiplier as number);

      if (outcome.isBlown) {
        setFullGrid(outcome.fullGrid);
        setPhase('resolved');
        setResult({ winAmountInCents: '0' });
        setShowWin(true);
      } else if (newPicked.length >= 8) {
        // Auto cash-out after 8 picks
        setFullGrid(outcome.fullGrid);
        setPhase('resolved');
        const win = BigInt(outcome.winAmountInCents as string);
        if (win > 0n) incrementBalance(win);
        setResult({ winAmountInCents: outcome.winAmountInCents as string });
        setShowWin(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pick failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [phase, sessionId, pickedIndices, incrementBalance]);

  const cashOut = useCallback(async () => {
    if (phase !== 'picking' || !sessionId || pickedIndices.length === 0) return;
    setLoading(true);

    try {
      const outcome = await resolveTreasure(sessionId, pickedIndices);
      setFullGrid(outcome.fullGrid);
      setPhase('resolved');
      const win = BigInt(outcome.winAmountInCents as string);
      if (win > 0n) incrementBalance(win);
      setResult({ winAmountInCents: outcome.winAmountInCents as string });
      setShowWin(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cashout failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [phase, sessionId, pickedIndices, incrementBalance]);

  const getTileState = (idx: number) => {
    const revealed = revealedTiles.find((t) => t.index === idx);
    if (revealed) return revealed.type === 'bomb' ? 'bomb' : 'treasure';
    if (fullGrid) {
      const fullTile = fullGrid.find((t) => t.index === idx);
      return fullTile?.type === 'bomb' ? 'bomb-hidden' : 'treasure-hidden';
    }
    return pickedIndices.includes(idx) ? 'loading' : 'hidden';
  };

  const potentialWin = currentBet > 0
    ? BigInt(Math.floor(currentBet * (PICK_MULTIPLIERS[pickedIndices.length] ?? 1.0)))
    : 0n;

  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games" className="text-neon-cyan/60 hover:text-neon-cyan font-heading text-sm">
            ← Games
          </Link>
          <h1 className="font-heading text-2xl font-bold neon-text-cyan">🗺️ PANDA TREASURE HUNT</h1>
          {sessionId && (
            <Link href={`/verify?session=${sessionId}`} className="text-xs text-neon-cyan/40">Verify ↗</Link>
          )}
        </div>

        {/* Grid */}
        {phase !== 'idle' && (
          <div className="glass-card p-4 border-neon-cyan/20">
            {phase === 'picking' && pickedIndices.length > 0 && (
              <div className="flex justify-between items-center mb-3">
                <div className="font-heading text-sm text-neon-cyan/60">
                  Picks: <span className="text-panda-white">{pickedIndices.length}</span> /
                  Multiplier: <span className="text-gold font-bold">{(PICK_MULTIPLIERS[pickedIndices.length - 1] ?? 1).toFixed(2)}×</span>
                </div>
                <button
                  onClick={cashOut}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-gold text-deep-black font-heading font-bold text-sm
                             shadow-neon-gold hover:opacity-90 disabled:opacity-40"
                >
                  💰 Cash Out — {formatPHP(potentialWin)}
                </button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: GRID_SIZE }, (_, i) => {
                const state = getTileState(i);
                return (
                  <motion.button
                    key={i}
                    onClick={() => void pickTile(i)}
                    disabled={phase !== 'picking' || loading || pickedIndices.includes(i)}
                    whileHover={{ scale: phase === 'picking' ? 1.05 : 1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl
                                border-2 transition-all ${
                      state === 'hidden'
                        ? 'bg-dark-card/80 border-dark-border hover:border-neon-cyan/40 cursor-pointer'
                      : state === 'treasure'
                        ? 'bg-gold/20 border-gold'
                      : state === 'bomb'
                        ? 'bg-neon-pink/20 border-neon-pink'
                      : state === 'loading'
                        ? 'bg-neon-cyan/10 border-neon-cyan/40 animate-pulse'
                      : state === 'bomb-hidden'
                        ? 'bg-neon-pink/10 border-neon-pink/30 opacity-60'
                      : 'bg-neon-cyan/5 border-neon-cyan/20 opacity-60'
                    }`}
                  >
                    <AnimatePresence>
                      {state === 'hidden' && <span>❓</span>}
                      {state === 'treasure' && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                          transition={{ type: 'spring' }}
                        >
                          💎
                        </motion.span>
                      )}
                      {state === 'bomb' && (
                        <motion.span
                          initial={{ scale: 2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          💣
                        </motion.span>
                      )}
                      {state === 'loading' && <span className="animate-spin text-lg">⟳</span>}
                      {state === 'bomb-hidden' && <span>💣</span>}
                      {state === 'treasure-hidden' && <span>💎</span>}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {isBlown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center font-heading text-neon-pink font-bold text-xl"
              >
                💣 BOOM! Hit a mine!
              </motion.div>
            )}
          </div>
        )}

        {error && <div className="text-neon-pink/80 text-sm text-center font-heading">{error}</div>}

        {/* Next round button after resolved */}
        {phase === 'resolved' && (
          <button
            onClick={() => setPhase('idle')}
            className="w-full py-3 rounded-xl bg-dark-card border border-neon-cyan/30
                       text-neon-cyan font-heading font-bold hover:bg-neon-cyan/10 transition-colors"
          >
            Play Again
          </button>
        )}

        {phase === 'idle' && (
          <>
            <div className="glass-card p-4 border-dark-border">
              <h3 className="font-heading text-sm text-panda-white/50 mb-3 tracking-wider uppercase">
                How to Play
              </h3>
              <ul className="space-y-1 text-sm text-panda-white/60 font-heading list-disc list-inside">
                <li>Pick tiles to uncover treasures 💎</li>
                <li>Avoid the 4 hidden mines 💣</li>
                <li>Multiplier grows with each safe pick</li>
                <li>Cash out anytime to secure your winnings</li>
              </ul>
            </div>

            <BetControls
              minBet={100}
              maxBet={100000}
              onBet={startHunt}
              disabled={loading}
              loading={loading}
            />
          </>
        )}
      </div>

      {showWin && result && (
        <WinDisplay
          winAmountInCents={result.winAmountInCents}
          multiplier={totalMultiplier}
          onClose={() => setShowWin(false)}
        />
      )}
    </main>
  );
}

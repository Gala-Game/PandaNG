'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { gameApi } from '@/lib/api';
import { useWalletStore, formatPHP } from '@/store/wallet.store';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

const SYMBOLS = ['🐼', '🎋', '💎', '7️⃣', '🌸', '⭐', '🔔', '🍀'];
const BET_PRESETS = [10, 50, 100, 500, 1000];

function ReelColumn({ symbols }: { symbols: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {symbols.map((sym, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-black/40 text-2xl md:h-16 md:w-16 md:text-3xl"
        >
          {sym}
        </motion.div>
      ))}
    </div>
  );
}

export default function SlotsPage() {
  const { isAuthenticated } = useAuthStore();
  const { balanceInCents, subtractBet, addWin, fetchBalance } = useWalletStore();
  const [betCents, setBetCents] = useState(100);
  const [reels, setReels] = useState<string[][]>(
    Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? '🐼'))
  );
  const [spinning, setSpinning] = useState(false);
  const [spinReels, setSpinReels] = useState(false);
  const [result, setResult] = useState<{ wins: Array<{ lineId: number; multiplier: number; winInCents: string }>; totalWinInCents: string; isJackpotEligible: boolean } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ serverSeedHash: string; clientSeed: string; nonce: number } | null>(null);
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
    setResult(null);
    setSpinning(true);
    setSpinReels(true);

    // Show spinning animation
    const animInterval = setInterval(() => {
      setReels(Array.from({ length: 5 }, () =>
        Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? '🐼')
      ));
    }, 80);

    try {
      // Start session
      const session = await gameApi.startSession({ gameType: 'SLOTS', betAmountInCents: safeBetCents });
      setSessionInfo({ serverSeedHash: session.serverSeedHash, clientSeed: session.clientSeed, nonce: session.nonce });
      subtractBet(BigInt(safeBetCents));

      // Wait for animation (1.5s)
      await new Promise((r) => setTimeout(r, 1500));
      clearInterval(animInterval);
      setSpinReels(false);

      // Resolve
      const res = await gameApi.resolveSession(session.sessionId, {});
      const gameResult = res.result as typeof result;
      setResult(gameResult);

      // Update reels to show actual result
      if (gameResult && Array.isArray(res.result?.reels)) {
        setReels(res.result.reels as string[][]);
      }

      if (gameResult && BigInt(gameResult.totalWinInCents) > 0n) {
        addWin(BigInt(gameResult.totalWinInCents));
      }
      await fetchBalance();
    } catch {
      setError('Failed to spin. Please try again.');
    } finally {
      clearInterval(animInterval);
      setSpinReels(false);
      setSpinning(false);
    }
  }, [spinning, isAuthenticated, betCents, balanceInCents, subtractBet, addWin, fetchBalance]);

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="mb-4 text-4xl">🎰</div>
          <h2 className="font-heading text-2xl font-bold">LOGIN TO PLAY</h2>
          <p className="mt-2 mb-4 text-gray-400">You need an account to play Panda Fortune Slots</p>
          <Link href="/login"><CyberButton variant="primary">Login / Register</CyberButton></Link>
        </GlassCard>
      </main>
    );
  }

  const winAmount = result ? BigInt(result.totalWinInCents) : 0n;

  return (
    <main className="min-h-screen bg-deep-black px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-4xl font-black text-gold">🎰 PANDA FORTUNE SLOTS</h1>
          <p className="mt-1 text-sm text-gray-400">5 reels • 20 paylines • Provably fair</p>
        </div>

        {/* Balance */}
        <GlassCard className="mb-4 flex items-center justify-between px-4 py-3">
          <span className="text-sm text-gray-400">Balance</span>
          <span className="font-heading text-lg font-bold text-neon-cyan">{formatPHP(balanceInCents)}</span>
        </GlassCard>

        {/* Reels */}
        <GlassCard glow="gold" className="mb-6 p-6">
          <div className="flex justify-center gap-2">
            {reels.map((col, i) => (
              <motion.div
                key={i}
                animate={spinReels ? { y: [0, -10, 10, 0] } : {}}
                transition={{ repeat: Infinity, duration: 0.15 }}
              >
                <ReelColumn symbols={col} />
              </motion.div>
            ))}
          </div>

          {/* Win display */}
          <AnimatePresence>
            {result && winAmount > 0n && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center"
              >
                <div className="font-heading text-3xl font-black text-gold">
                  WIN! {formatPHP(winAmount)}
                </div>
                {result.isJackpotEligible && (
                  <div className="mt-1 text-neon-pink font-bold">🏆 JACKPOT ELIGIBLE!</div>
                )}
              </motion.div>
            )}
            {result && winAmount === 0n && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center text-gray-500 font-heading"
              >
                No win this time. Keep spinning! 🐼
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Bet controls */}
        <GlassCard className="mb-4 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {BET_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setBetCents(p * 100)}
                className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                  betCents === p * 100
                    ? 'bg-gold text-black'
                    : 'border border-white/20 text-gray-300 hover:border-gold/50'
                }`}
              >
                ₱{p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
             <input
               type="number"
               min={10}
               max={10_000_000}
               step={1}
               value={betCents}
               onChange={(e) => setBetCents(Number(e.target.value))}
               className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-gold/50 focus:outline-none"
               placeholder="Bet (cents)"
             />
             <span className="text-sm text-gray-400">{formatPHP(BigInt(normalizedBetCents))}</span>
           </div>
         </GlassCard>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <CyberButton
          variant="gold"
          size="lg"
          className="w-full text-xl tracking-widest"
          isLoading={spinning}
          onClick={spin}
        >
          {spinning ? 'SPINNING…' : '🎰 SPIN'}
        </CyberButton>

        {/* Provably fair info */}
        {sessionInfo && (
          <GlassCard className="mt-4 p-3 text-xs text-gray-500">
            <p className="font-bold text-gray-400 mb-1">Provably Fair</p>
            <p>Server Seed Hash: <span className="text-gray-300 break-all">{sessionInfo.serverSeedHash}</span></p>
            <p>Client Seed: <span className="text-gray-300">{sessionInfo.clientSeed}</span></p>
            <p>Nonce: {sessionInfo.nonce}</p>
          </GlassCard>
        )}
      </div>
    </main>
  );
}

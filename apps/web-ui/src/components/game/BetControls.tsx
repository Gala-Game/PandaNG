'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBalance } from '@/lib/api';
import { useWalletStore } from '@/store';

/** Format cents to PHP display string */
export function formatPHP(cents: bigint | string): string {
  const n = typeof cents === 'string' ? BigInt(cents) : cents;
  const major = n / 100n;
  const minor = n % 100n;
  return `₱${major.toLocaleString()}.${String(minor).padStart(2, '0')}`;
}

interface BetControlsProps {
  minBet: number; // in cents
  maxBet: number; // in cents
  onBet: (amountInCents: number) => void;
  disabled?: boolean;
  loading?: boolean;
}

const QUICK_BETS = [100, 500, 1000, 5000, 10000]; // in cents

export function BetControls({ minBet, maxBet, onBet, disabled, loading }: BetControlsProps) {
  const { balanceInCents } = useWalletStore();
  const [betStr, setBetStr] = useState(String(minBet));
  const bet = Math.max(minBet, Math.min(maxBet, parseInt(betStr, 10) || minBet));

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-neon-cyan/70 text-sm font-heading tracking-wider uppercase">
          Bet Amount
        </span>
        <span className="text-panda-white/60 text-xs">
          Balance: {formatPHP(balanceInCents)}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={betStr}
          onChange={(e) => setBetStr(e.target.value)}
          min={minBet}
          max={maxBet}
          step={100}
          className="flex-1 bg-deep-black border border-dark-border rounded-lg px-3 py-2
                     text-panda-white font-heading text-lg focus:border-neon-cyan/50 focus:outline-none"
          placeholder="Bet in cents"
          disabled={disabled}
        />
        <button
          onClick={() => setBetStr(String(Math.min(maxBet, bet * 2)))}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-neon-cyan/70
                     hover:border-neon-cyan/40 font-heading text-sm transition-colors"
          disabled={disabled}
        >
          2×
        </button>
        <button
          onClick={() => setBetStr(String(Math.max(minBet, Math.floor(bet / 2))))}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-neon-cyan/70
                     hover:border-neon-cyan/40 font-heading text-sm transition-colors"
          disabled={disabled}
        >
          ½
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_BETS.filter((b) => b >= minBet && b <= maxBet).map((b) => (
          <button
            key={b}
            onClick={() => setBetStr(String(b))}
            className={`px-3 py-1 rounded-lg font-heading text-xs border transition-colors ${
              bet === b
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                : 'bg-dark-card border-dark-border text-panda-white/60 hover:border-neon-cyan/30'
            }`}
            disabled={disabled}
          >
            {formatPHP(BigInt(b))}
          </button>
        ))}
      </div>

      <button
        onClick={() => onBet(bet)}
        disabled={
          disabled ||
          loading ||
          bet < minBet ||
          bet > maxBet ||
          BigInt(bet) > balanceInCents
        }
        className="w-full cyber-btn py-3 rounded-xl bg-neon-cyan text-deep-black font-bold
                   text-lg shadow-neon-cyan disabled:opacity-40 disabled:cursor-not-allowed
                   hover:shadow-neon-cyan transition-all"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin">⟳</span> Spinning...
          </span>
        ) : (
          `Place Bet — ${formatPHP(BigInt(bet))}`
        )}
      </button>
    </div>
  );
}

interface WinDisplayProps {
  winAmountInCents: string;
  multiplier?: number;
  onClose: () => void;
}

export function WinDisplay({ winAmountInCents, multiplier, onClose }: WinDisplayProps) {
  const isWin = BigInt(winAmountInCents) > 0n;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <div
          className={`glass-card p-8 text-center border-2 pointer-events-auto ${
            isWin ? 'border-gold/60 shadow-neon-gold' : 'border-neon-pink/40'
          }`}
        >
          {isWin ? (
            <>
              <div className="text-5xl mb-2 animate-float">🎉</div>
              <div className="font-heading text-2xl neon-text-gold font-bold">YOU WIN!</div>
              <div className="font-heading text-3xl neon-text-gold mt-1">
                {formatPHP(BigInt(winAmountInCents))}
              </div>
              {multiplier && multiplier > 1 && (
                <div className="text-neon-cyan/70 text-sm mt-1">{multiplier}× multiplier</div>
              )}
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">💨</div>
              <div className="font-heading text-xl text-panda-white/70">Better luck next time!</div>
            </>
          )}
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 border border-dark-border rounded-lg text-panda-white/60
                       hover:border-neon-cyan/30 font-heading text-sm transition-colors"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function BalanceTicker() {
  const { balanceInCents, currency, setBalance } = useWalletStore();

  useEffect(() => {
    // Fetch balance on mount
    getBalance()
      .then((b) => setBalance(BigInt(b.balanceInCents), b.currency))
      .catch(() => null);
  }, [setBalance]);

  return (
    <div className="flex items-center gap-2 glass-card px-3 py-1 border-neon-cyan/20">
      <span className="text-neon-cyan/60 text-xs font-heading tracking-wider">
        {currency}
      </span>
      <span className="font-heading font-bold text-panda-white text-sm">
        {formatPHP(balanceInCents)}
      </span>
    </div>
  );
}

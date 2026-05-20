'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { verifySession } from '@/lib/api';

interface VerifyResult {
  sessionId: string;
  gameType?: string;
  serverSeed?: string;
  serverSeedHash: string;
  computedHash?: string;
  hashMatches?: boolean;
  clientSeed: string;
  nonce: number;
  betAmountInCents?: string;
  winAmountInCents?: string;
  status?: string;
  startedAt?: string;
  endedAt?: string;
  message?: string;
}

function VerifyForm() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(searchParams.get('session') ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifySession(sessionId.trim());
      setResult(data as VerifyResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Session not found';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-deep-black bg-cyber-grid bg-[size:40px_40px] px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold neon-text-cyan">🔒 PROVABLY FAIR VERIFY</h1>
          <p className="text-panda-white/50 text-sm font-body">
            Enter any completed session ID to independently verify the game outcome.
          </p>
        </div>

        <div className="glass-card p-6 border-neon-cyan/20 space-y-4">
          <div>
            <label className="block font-heading text-panda-white/60 text-sm mb-2 uppercase tracking-wider">
              Session ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void verify()}
                placeholder="e.g. cm1abc2def3ghi..."
                className="flex-1 bg-deep-black border border-dark-border rounded-lg px-4 py-3
                           text-panda-white font-body text-sm focus:border-neon-cyan/50 focus:outline-none"
              />
              <button
                onClick={() => void verify()}
                disabled={loading || !sessionId.trim()}
                className="px-6 py-3 rounded-lg bg-neon-cyan text-deep-black font-heading font-bold
                           shadow-neon-cyan disabled:opacity-40 hover:shadow-neon-cyan transition-shadow"
              >
                {loading ? '⟳' : 'Verify'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 border-neon-pink/30 text-neon-pink/80 font-heading text-sm">
            {error}
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-neon-cyan/20 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-panda-white">Verification Result</h2>
              {result.hashMatches !== undefined && (
                <span
                  className={`px-3 py-1 rounded-lg font-heading font-bold text-sm ${
                    result.hashMatches
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                  }`}
                >
                  {result.hashMatches ? '✓ VERIFIED' : '✗ TAMPERED'}
                </span>
              )}
            </div>

            {result.message && (
              <p className="text-neon-cyan/60 text-sm font-body">{result.message}</p>
            )}

            <div className="space-y-3">
              {[
                { label: 'Session ID',     value: result.sessionId },
                { label: 'Game Type',      value: result.gameType },
                { label: 'Status',         value: result.status },
                { label: 'Server Seed',    value: result.serverSeed, mono: true },
                { label: 'Server Seed Hash', value: result.serverSeedHash, mono: true },
                { label: 'Computed Hash',  value: result.computedHash, mono: true },
                { label: 'Client Seed',    value: result.clientSeed, mono: true },
                { label: 'Nonce',          value: result.nonce?.toString() },
                { label: 'Bet',            value: result.betAmountInCents ? `${result.betAmountInCents} cents` : undefined },
                { label: 'Win',            value: result.winAmountInCents ? `${result.winAmountInCents} cents` : undefined },
                { label: 'Started',        value: result.startedAt },
                { label: 'Ended',          value: result.endedAt },
              ].filter((r) => r.value !== undefined).map(({ label, value, mono }) => (
                <div key={label} className="space-y-1">
                  <span className="text-panda-white/40 text-xs font-heading uppercase tracking-wider">{label}</span>
                  <div
                    className={`text-panda-white/80 text-sm break-all ${mono ? 'font-mono bg-dark-card/60 rounded px-2 py-1 text-xs' : 'font-body'}`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-border pt-4">
              <h3 className="font-heading text-sm text-panda-white/40 mb-2 uppercase tracking-wider">
                How to verify manually
              </h3>
              <pre className="text-xs text-panda-white/50 font-mono bg-dark-card/60 rounded p-3 overflow-x-auto">
{`# Using Node.js:
const crypto = require('crypto');
const hash = crypto
  .createHash('sha256')
  .update(serverSeed)
  .digest('hex');
console.log(hash === serverSeedHash); // true = fair

# For outcome verification:
const hmac = crypto
  .createHmac('sha256', serverSeed)
  .update(clientSeed + ':' + nonce)
  .digest('hex');
const float = parseInt(hmac.slice(0, 8), 16) / 0x100000000;`}
              </pre>
            </div>
          </motion.div>
        )}

        <Link href="/games" className="block text-center text-neon-cyan/50 hover:text-neon-cyan font-heading text-sm">
          ← Back to Games
        </Link>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-deep-black flex items-center justify-center text-neon-cyan font-heading">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}

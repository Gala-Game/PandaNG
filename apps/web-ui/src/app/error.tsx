'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-deep-black flex flex-col items-center justify-center z-50">
      <div className="text-6xl mb-4">😵</div>
      <h2 className="font-heading text-2xl text-neon-pink mb-2">Something went wrong!</h2>
      <p className="text-panda-white/60 mb-6 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="cyber-btn px-6 py-2 rounded-lg border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
      >
        Try Again
      </button>
    </div>
  );
}

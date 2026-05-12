import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-deep-black flex flex-col items-center justify-center">
      <div className="text-8xl mb-4">🐼</div>
      <h1 className="font-heading text-6xl font-bold neon-text-cyan mb-2">404</h1>
      <p className="text-panda-white/60 mb-6">This bamboo path leads nowhere.</p>
      <Link href="/" className="cyber-btn px-6 py-2 rounded-lg bg-neon-cyan text-deep-black font-bold">
        Return Home
      </Link>
    </div>
  );
}

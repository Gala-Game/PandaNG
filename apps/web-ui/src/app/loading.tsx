export default function Loading() {
  return (
    <div className="fixed inset-0 bg-deep-black flex flex-col items-center justify-center z-50">
      <div className="text-6xl animate-float mb-4">🐼</div>
      <div className="font-heading text-neon-cyan text-xl tracking-widest animate-neon-pulse">
        LOADING...
      </div>
      <div className="mt-4 w-48 h-1 bg-dark-border rounded-full overflow-hidden">
        <div className="h-full bg-neon-cyan rounded-full animate-shimmer bg-shimmer bg-[length:200%_100%]" />
      </div>
    </div>
  );
}

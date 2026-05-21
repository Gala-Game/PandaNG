'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'cyan' | 'pink' | 'gold' | 'none';
}

export function GlassCard({ children, className, glow = 'none' }: GlassCardProps) {
  const glows = {
    cyan: 'shadow-neon-cyan border-neon-cyan/30',
    pink: 'shadow-neon-pink border-neon-pink/30',
    gold: 'shadow-neon-gold border-gold/30',
    none: 'border-white/10',
  };

  return (
    <div
      className={clsx(
        'rounded-xl border bg-white/5 backdrop-blur-md',
        glows[glow],
        className,
      )}
    >
      {children}
    </div>
  );
}

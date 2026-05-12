'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export function CyberButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: CyberButtonProps) {
  const base =
    'inline-flex items-center justify-center font-heading font-bold tracking-wider rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-neon-cyan text-black hover:bg-neon-cyan/80 shadow-neon-cyan focus:ring-neon-cyan',
    secondary:
      'border border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 focus:ring-neon-cyan',
    danger:
      'bg-neon-pink text-white hover:bg-neon-pink/80 shadow-neon-pink focus:ring-neon-pink',
    gold: 'bg-gold text-black hover:bg-gold/80 shadow-neon-gold focus:ring-gold',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

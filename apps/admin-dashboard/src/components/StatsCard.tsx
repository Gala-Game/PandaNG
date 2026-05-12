import { clsx } from 'clsx';

type ColorVariant = 'orange' | 'cyan' | 'pink' | 'green' | 'gold' | 'red';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  variant?: ColorVariant;
  loading?: boolean;
}

const variantStyles: Record<ColorVariant, { border: string; text: string; bg: string; shadow: string }> = {
  orange: {
    border: 'border-neon-orange/30',
    text: 'text-neon-orange',
    bg: 'bg-neon-orange/5',
    shadow: 'shadow-neon-orange',
  },
  cyan: {
    border: 'border-neon-cyan/30',
    text: 'text-neon-cyan',
    bg: 'bg-neon-cyan/5',
    shadow: 'shadow-neon-cyan',
  },
  pink: {
    border: 'border-neon-pink/30',
    text: 'text-neon-pink',
    bg: 'bg-neon-pink/5',
    shadow: 'shadow-neon-pink',
  },
  green: {
    border: 'border-neon-green/30',
    text: 'text-neon-green',
    bg: 'bg-neon-green/5',
    shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]',
  },
  gold: {
    border: 'border-gold/30',
    text: 'text-gold',
    bg: 'bg-gold/5',
    shadow: 'shadow-neon-gold',
  },
  red: {
    border: 'border-neon-red/30',
    text: 'text-neon-red',
    bg: 'bg-neon-red/5',
    shadow: 'shadow-neon-red',
  },
};

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'orange',
  loading = false,
}: StatsCardProps) {
  const styles = variantStyles[variant];
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={clsx(
        'relative bg-dark-card border rounded-xl p-5 overflow-hidden transition-all duration-300 hover:scale-[1.02]',
        styles.border,
        styles.bg,
      )}
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:20px_20px] opacity-30 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-body text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-32 bg-dark-border animate-pulse rounded mt-1" />
          ) : (
            <p className={clsx('text-2xl font-heading font-bold truncate', styles.text)}>{value}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={clsx(
                  'text-xs font-body font-medium',
                  isPositive ? 'text-neon-green' : 'text-neon-red',
                )}
              >
                {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 font-body">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={clsx(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border',
            styles.border,
            styles.text,
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

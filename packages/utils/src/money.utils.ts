// IMPORTANT: All monetary values use BigInt in cents to avoid float precision issues.
// Never use floating point for money calculations.

export function centsToDisplay(amountInCents: bigint, currency = 'PHP'): string {
  const amount = Number(amountInCents) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amountInCents: bigint, currency = 'PHP'): string {
  return centsToDisplay(amountInCents, currency);
}

export function toCents(amount: number): bigint {
  // Round to avoid floating point issues: 1.005 * 100 = 100.49999...
  return BigInt(Math.round(amount * 100));
}

export function fromCents(amountInCents: bigint): number {
  return Number(amountInCents) / 100;
}

export function addCents(a: bigint, b: bigint): bigint {
  return a + b;
}

export function subtractCents(a: bigint, b: bigint): bigint {
  if (b > a) throw new Error('Insufficient funds: cannot subtract more than available');
  return a - b;
}

export function multiplyCents(amountInCents: bigint, multiplier: number): bigint {
  // Use integer arithmetic to avoid floating point issues
  const multiplierCents = BigInt(Math.round(multiplier * 1000));
  return (amountInCents * multiplierCents) / 1000n;
}

export function calculatePercentage(amountInCents: bigint, percentage: number): bigint {
  const percentageBasisPoints = BigInt(Math.round(percentage * 100));
  return (amountInCents * percentageBasisPoints) / 10000n;
}

export function serializeBigInt(value: bigint): string {
  return value.toString();
}

export function deserializeBigInt(value: string): bigint {
  return BigInt(value);
}

export function formatCompact(amountInCents: bigint): string {
  const amount = Number(amountInCents) / 100;
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`;
  return `₱${amount.toFixed(2)}`;
}

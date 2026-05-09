// IMPORTANT: All monetary values use BigInt in cents to avoid float precision issues.
// Never use floating point for money calculations.

export function centsToDisplay(amountInCents: bigint, currency = 'PHP'): string {
  // Use BigInt arithmetic to avoid precision loss from Number() cast.
  // Number.MAX_SAFE_INTEGER ≈ 90.07 trillion cents; anything above loses precision silently.
  const negative = amountInCents < 0n;
  const abs = negative ? -amountInCents : amountInCents;
  const majorUnits = abs / 100n;
  const minorUnits = abs % 100n;
  // Intl.NumberFormat accepts BigInt in Node 19+ / modern browsers
  const majorFormatted = Intl.NumberFormat('en-US').format(majorUnits);
  const minorStr = minorUnits.toString().padStart(2, '0');
  const symbol = currency === 'PHP' ? '₱' : `${currency} `;
  return `${negative ? '-' : ''}${symbol}${majorFormatted}.${minorStr}`;
}

export function formatCurrency(amountInCents: bigint, currency = 'PHP'): string {
  return centsToDisplay(amountInCents, currency);
}

export function toCents(amount: number): bigint {
  // Round to avoid floating point issues: 1.005 * 100 = 100.49999...
  return BigInt(Math.round(amount * 100));
}

/**
 * Convert cents to a floating-point number for approximate display only.
 * Do NOT use the result for financial calculations — it loses precision above ~900 trillion cents.
 */
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
  // Compact display is approximate by nature; safe to use Number here
  const amount = Number(amountInCents) / 100;
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`;
  return `₱${amount.toFixed(2)}`;
}

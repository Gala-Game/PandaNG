export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BET = 'BET',
  WIN = 'WIN',
  BONUS = 'BONUS',
  REFUND = 'REFUND',
  CASHBACK = 'CASHBACK',
  TRANSFER = 'TRANSFER',
  JACKPOT_WIN = 'JACKPOT_WIN',
  MISSION_REWARD = 'MISSION_REWARD',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

export enum CurrencyCode {
  PHP = 'PHP',
  USD = 'USD',
  USDT = 'USDT',
}

export interface Wallet {
  id: string;
  userId: string;
  balanceInCents: bigint;
  bonusBalanceInCents: bigint;
  currency: CurrencyCode;
  updatedAt: Date;
}

export interface WalletLedgerEntry {
  id: string;
  walletId: string;
  type: TransactionType;
  amountInCents: bigint;
  balanceBeforeInCents: bigint;
  balanceAfterInCents: bigint;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateDepositDto {
  amountInCents: number;
  currency: CurrencyCode;
  provider: string;
  method: string;
}

export interface WithdrawalRequest {
  amountInCents: number;
  currency: CurrencyCode;
  bankAccountNumber?: string;
  bankCode?: string;
  eWalletNumber?: string;
  provider: string;
}

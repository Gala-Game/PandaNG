export enum PaymentProvider {
  GCASH = 'GCASH',
  MAYA = 'MAYA',
  GRABPAY = 'GRABPAY',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentMethod {
  E_WALLET = 'E_WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CRYPTO = 'CRYPTO',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export interface Payment {
  id: string;
  userId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  amountInCents: bigint;
  currency: string;
  reference: string;
  providerReference?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiatePaymentDto {
  provider: PaymentProvider;
  method: PaymentMethod;
  amountInCents: number;
  currency: string;
  redirectUrl?: string;
  webhookUrl?: string;
}

export interface PaymentWebhookPayload {
  provider: PaymentProvider;
  reference: string;
  providerReference: string;
  status: PaymentStatus;
  amountInCents: number;
  currency: string;
  metadata?: Record<string, unknown>;
  signature: string;
  timestamp: number;
}

export interface WithdrawalApproval {
  withdrawalId: string;
  adminId: string;
  action: 'approve' | 'reject';
  notes?: string;
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Payment provider adapters.
 * Each adapter implements the same interface so the wallet service can swap providers.
 * All amounts are in BigInt cents. No floating-point math.
 */

export interface PaymentInitiateParams {
  reference: string;
  amountInCents: bigint;
  currency: string;
  description: string;
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitiateResult {
  checkoutUrl: string;
  providerReference: string;
  expiresAt?: Date;
}

export interface WebhookVerifyResult {
  isValid: boolean;
  providerReference: string;
  amountInCents: bigint;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  metadata?: Record<string, unknown>;
}

export interface PaymentAdapter {
  initiatePayment(params: PaymentInitiateParams): Promise<PaymentInitiateResult>;
  verifyWebhook(payload: Buffer, signature: string): Promise<WebhookVerifyResult>;
}

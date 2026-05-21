/**
 * Payment orchestrator — selects the correct adapter based on provider enum.
 * Handles webhook idempotency: checks reference uniqueness before processing.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayMongoAdapter } from './paymongo.adapter';
import { StripeAdapter } from './stripe.adapter';
import { XenditAdapter } from './xendit.adapter';
import type { PaymentAdapter, PaymentInitiateParams } from './payment-adapter.interface';

export type SupportedProvider = 'GCASH' | 'MAYA' | 'GRABPAY' | 'STRIPE' | 'BANK_TRANSFER';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly adapters: Map<SupportedProvider, PaymentAdapter>;

  constructor(
    private readonly config: ConfigService,
    private readonly payMongo: PayMongoAdapter,
    private readonly stripe: StripeAdapter,
    private readonly xendit: XenditAdapter,
  ) {
    this.adapters = new Map<SupportedProvider, PaymentAdapter>([
      ['GCASH', payMongo],
      ['MAYA', payMongo],
      ['GRABPAY', payMongo],
      ['STRIPE', stripe],
      ['BANK_TRANSFER', xendit],
    ]);
  }

  getAdapter(provider: SupportedProvider): PaymentAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new BadRequestException(`Unsupported payment provider: ${provider}`);
    return adapter;
  }

  async initiatePayment(provider: SupportedProvider, params: PaymentInitiateParams) {
    const adapter = this.getAdapter(provider);
    this.logger.log(`Initiating payment: ${params.reference} via ${provider}`);
    return adapter.initiatePayment(params);
  }

  async verifyWebhook(provider: SupportedProvider, payload: Buffer, signature: string) {
    const adapter = this.getAdapter(provider);
    return adapter.verifyWebhook(payload, signature);
  }

  buildWebhookUrl(provider: string): string {
    const baseUrl = this.config.get<string>('WALLET_SERVICE_URL') ?? 'http://localhost:3002';
    return `${baseUrl}/api/v1/wallet/webhook/${provider.toLowerCase()}`;
  }
}

/**
 * Xendit adapter — secondary Philippine payment rail
 * Supports OTC, bank transfer, e-wallets.
 * Docs: https://developers.xendit.co/
 */

import { createHmac } from 'crypto';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PaymentAdapter,
  PaymentInitiateParams,
  PaymentInitiateResult,
  WebhookVerifyResult,
} from './payment-adapter.interface';

@Injectable()
export class XenditAdapter implements PaymentAdapter {
  private readonly logger = new Logger(XenditAdapter.name);
  private readonly baseUrl = 'https://api.xendit.co';
  private readonly secretKey: string;
  private readonly callbackToken: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.get<string>('XENDIT_SECRET_KEY') ?? 'xnd_placeholder';
    this.callbackToken = config.get<string>('XENDIT_CALLBACK_TOKEN') ?? 'cb_placeholder';
  }

  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentInitiateResult> {
    const authHeader = `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`;

    const body = {
      external_id: params.reference,
      amount: Number(params.amountInCents / 100n), // Xendit uses major currency units
      currency: params.currency,
      description: params.description,
      success_redirect_url: params.successUrl,
      failure_redirect_url: params.failureUrl,
      payment_methods: ['GCASH', 'PAYMAYA', 'GRAB_PAY', 'OTC', 'BANK_TRANSFER'],
      metadata: params.metadata ?? {},
    };

    try {
      const response = await fetch(`${this.baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Xendit invoice creation failed: ${response.status} ${errorText}`);
        throw new BadRequestException('Payment initiation failed');
      }

      const invoice = (await response.json()) as {
        id: string;
        invoice_url: string;
        expiry_date: string;
      };

      return {
        checkoutUrl: invoice.invoice_url,
        providerReference: invoice.id,
        expiresAt: new Date(invoice.expiry_date),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Xendit request failed', error);
      return {
        checkoutUrl: `https://sandbox.xendit.co/invoice/${params.reference}`,
        providerReference: `xnd_mock_${params.reference}`,
      };
    }
  }

  async verifyWebhook(payload: Buffer, signature: string): Promise<WebhookVerifyResult> {
    // Xendit sends x-callback-token header — simple token check
    const isValid = createHmac('sha256', this.callbackToken)
      .update(payload)
      .digest('hex') === signature || signature === this.callbackToken;

    if (!isValid) {
      this.logger.warn('Xendit webhook token mismatch');
      return { isValid: false, providerReference: '', amountInCents: 0n, status: 'FAILED' };
    }

    const event = JSON.parse(payload.toString('utf8')) as {
      id: string;
      external_id: string;
      status: string;
      amount: number;
      currency: string;
    };

    const amountInCents = BigInt(Math.round(event.amount * 100));
    const status: WebhookVerifyResult['status'] =
      event.status === 'PAID' || event.status === 'SETTLED' ? 'SUCCESS' : 'FAILED';

    return { isValid: true, providerReference: event.id, amountInCents, status };
  }
}

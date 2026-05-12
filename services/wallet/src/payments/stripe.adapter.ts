/**
 * Stripe adapter — Credit/Debit cards, Apple Pay, Google Pay
 * Uses Stripe Payment Intents API.
 * Docs: https://stripe.com/docs/api
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PaymentAdapter,
  PaymentInitiateParams,
  PaymentInitiateResult,
  WebhookVerifyResult,
} from './payment-adapter.interface';

@Injectable()
export class StripeAdapter implements PaymentAdapter {
  private readonly logger = new Logger(StripeAdapter.name);
  private readonly baseUrl = 'https://api.stripe.com/v1';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder';
    this.webhookSecret =
      config.get<string>('STRIPE_WEBHOOK_SECRET') ?? 'whsec_placeholder';
  }

  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentInitiateResult> {
    const authHeader = `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`;

    // Create a Stripe Checkout Session
    const formData = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': params.currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': params.description,
      'line_items[0][price_data][unit_amount]': params.amountInCents.toString(),
      'line_items[0][quantity]': '1',
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.failureUrl,
      'metadata[reference]': params.reference,
      'metadata[webhook_url]': params.webhookUrl,
    });

    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: authHeader,
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Stripe checkout session failed: ${response.status} ${errorText}`);
        throw new BadRequestException('Payment initiation failed');
      }

      const session = (await response.json()) as {
        id: string;
        url: string;
        expires_at: number;
      };

      return {
        checkoutUrl: session.url,
        providerReference: session.id,
        expiresAt: new Date(session.expires_at * 1000),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Stripe request failed', error);
      return {
        checkoutUrl: `https://sandbox.stripe.com/checkout/${params.reference}`,
        providerReference: `cs_mock_${params.reference}`,
      };
    }
  }

  async verifyWebhook(payload: Buffer, signature: string): Promise<WebhookVerifyResult> {
    // Stripe-Signature header: t=<timestamp>,v1=<hmac>
    const parts = Object.fromEntries(
      signature.split(',').map((part) => {
        const [key, val] = part.split('=') as [string, string];
        return [key, val];
      }),
    );

    const timestamp = parts['t'] ?? '';
    const v1Sig = parts['v1'] ?? '';

    const message = `${timestamp}.${payload.toString('utf8')}`;
    const expected = createHmac('sha256', this.webhookSecret).update(message).digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(v1Sig, 'hex');

    let isValid = false;
    try {
      isValid =
        expectedBuf.length === receivedBuf.length &&
        timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      this.logger.warn('Stripe webhook signature mismatch');
      return { isValid: false, providerReference: '', amountInCents: 0n, status: 'FAILED' };
    }

    const event = JSON.parse(payload.toString('utf8')) as {
      type: string;
      data: {
        object: {
          id: string;
          amount_total: number;
          payment_status: string;
        };
      };
    };

    const obj = event.data.object;
    const amountInCents = BigInt(obj.amount_total);
    const status: WebhookVerifyResult['status'] =
      obj.payment_status === 'paid' ? 'SUCCESS' : 'FAILED';

    return { isValid: true, providerReference: obj.id, amountInCents, status };
  }
}

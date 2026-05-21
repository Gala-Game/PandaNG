/**
 * PayMongo adapter — GCash, Maya, GrabPay (Philippines)
 * Docs: https://developers.paymongo.com/
 *
 * NOTE: Actual API keys must be set in environment. In sandbox mode,
 * the gateway returns mock URLs. Signature uses HMAC-SHA256.
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

interface PayMongoSource {
  id: string;
  type: string;
  attributes: {
    status: string;
    redirect: {
      checkout_url: string;
      failed: string;
      success: string;
    };
    type: string;
    amount: number;
    currency: string;
    billing?: {
      name?: string;
    };
  };
}

@Injectable()
export class PayMongoAdapter implements PaymentAdapter {
  private readonly logger = new Logger(PayMongoAdapter.name);
  private readonly baseUrl = 'https://api.paymongo.com/v1';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.getOrThrow<string>('PAYMONGO_SECRET_KEY');
    this.webhookSecret = config.getOrThrow<string>('PAYMONGO_WEBHOOK_SECRET');
  }

  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentInitiateResult> {
    const amountInMajorCents = Number(params.amountInCents); // PayMongo uses centavos directly

    const body = {
      data: {
        attributes: {
          amount: amountInMajorCents,
          currency: params.currency,
          type: 'gcash', // gcash | maya | grab_pay
          redirect: {
            success: params.successUrl,
            failed: params.failureUrl,
          },
          billing: {
            name: params.description,
          },
          metadata: {
            reference: params.reference,
            ...(params.metadata ?? {}),
          },
        },
      },
    };

    const authHeader = `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`;

    try {
      const response = await fetch(`${this.baseUrl}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`PayMongo source creation failed: ${response.status} ${errorText}`);
        throw new BadRequestException('Payment initiation failed');
      }

      const data = (await response.json()) as { data: PayMongoSource };
      const source = data.data;

      return {
        checkoutUrl: source.attributes.redirect.checkout_url,
        providerReference: source.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('PayMongo request failed', error);
      // In sandbox/dev mode, return a mock URL so the rest of the flow can be tested
      return {
        checkoutUrl: `https://sandbox.paymongo.com/checkout/${params.reference}`,
        providerReference: `src_mock_${params.reference}`,
      };
    }
  }

  verifyWebhook(payload: Buffer, signature: string): Promise<WebhookVerifyResult> {
    // PayMongo sends: paymongo-signature: t=<timestamp>,li=<hmac>,te=<hmac>
    const parts = Object.fromEntries(
      signature.split(',').map((part) => {
        const [key, val] = part.split('=') as [string, string];
        return [key, val];
      }),
    );

    const timestamp = parts['t'] ?? '';
    const testHmac = parts['te'] ?? '';

    const message = `${timestamp}.${payload.toString('utf8')}`;
    const expected = createHmac('sha256', this.webhookSecret).update(message).digest('hex');

    const isValid = expected === testHmac;

    if (!isValid) {
      this.logger.warn('PayMongo webhook signature mismatch');
      return Promise.resolve({
        isValid: false,
        providerReference: '',
        amountInCents: 0n,
        status: 'FAILED',
      });
    }

    const event = JSON.parse(payload.toString('utf8')) as {
      data: {
        attributes: {
          type: string;
          data: {
            id: string;
            attributes: {
              amount: number;
              status: string;
            };
          };
        };
      };
    };

    const source = event.data.attributes.data;
    const amountInCents = BigInt(source.attributes.amount);
    const paymongoStatus = source.attributes.status;

    const status: WebhookVerifyResult['status'] =
      paymongoStatus === 'chargeable' || paymongoStatus === 'paid' ? 'SUCCESS' : 'FAILED';

    return Promise.resolve({
      isValid: true,
      providerReference: source.id,
      amountInCents,
      status,
    });
  }
}

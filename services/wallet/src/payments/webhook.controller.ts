import {
  Controller,
  Post,
  Param,
  Req,
  Headers,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import type { SupportedProvider } from './payment.service';

const SUPPORTED_PROVIDERS: SupportedProvider[] = [
  'GCASH',
  'MAYA',
  'GRABPAY',
  'STRIPE',
  'BANK_TRANSFER',
];

@ApiTags('webhooks')
@Controller('wallet/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment webhook handler (idempotent)' })
  async handleWebhook(
    @Param('provider') providerRaw: string,
    @Req() req: Request,
    @Headers('stripe-signature') stripeSignature?: string,
    @Headers('paymongo-signature') paymongoSignature?: string,
    @Headers('x-callback-token') xenditToken?: string,
  ) {
    const provider = providerRaw.toUpperCase() as SupportedProvider;
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      throw new BadRequestException(`Unknown provider: ${provider}`);
    }

    const rawBody: Buffer | undefined = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || rawBody.length === 0) {
      this.logger.warn(`Webhook from ${provider} received without raw body — rejecting`);
      throw new BadRequestException('Raw body required for signature verification');
    }

    const signature = stripeSignature ?? paymongoSignature ?? xenditToken ?? '';

    let verification;
    try {
      verification = await this.paymentService.verifyWebhook(provider, rawBody, signature);
    } catch (error) {
      this.logger.warn(`Webhook verification error for ${provider}:`, error);
      throw new BadRequestException('Webhook verification failed');
    }

    if (!verification.isValid) {
      this.logger.warn(`Invalid webhook signature from ${provider}`);
      // Return 200 anyway to prevent retries, but don't process
      return { received: true };
    }

    // Idempotency: check if this (provider, providerReference) pair was already processed
    const existing = await this.prisma.payment.findFirst({
      where: {
        providerReference: verification.providerReference,
        provider: provider as import('@prisma/client').PaymentProvider,
      },
    });

    if (existing && existing.status === 'SUCCESS') {
      this.logger.log(
        `Idempotent: webhook for ${verification.providerReference} already processed`,
      );
      return { received: true, idempotent: true };
    }

    if (verification.status === 'SUCCESS') {
      // Find payment by stable (provider, providerReference) — never match by amount to avoid cross-user collisions
      const payment = await this.prisma.payment.findFirst({
        where: {
          providerReference: verification.providerReference,
          provider: provider as import('@prisma/client').PaymentProvider,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (payment) {
        // Atomically mark SUCCESS and credit wallet in a single transaction to prevent double-credits
        await this.prisma.$transaction(async (tx) => {
          // Conditional update: only proceeds if still not SUCCESS (prevents race conditions)
          const updated = await tx.payment.updateMany({
            where: { id: payment.id, status: { not: 'SUCCESS' } },
            data: {
              status: 'SUCCESS',
              providerReference: verification.providerReference,
              webhookReceivedAt: new Date(),
            },
          });

          if (updated.count === 0) {
            // Another process already completed this payment — skip credit
            return;
          }

          const wallet = await tx.wallet.findUnique({
            where: { userId: payment.userId },
            select: { id: true, balanceInCents: true },
          });
          if (!wallet) throw new Error(`Wallet not found for user ${payment.userId}`);

          const balanceBefore = wallet.balanceInCents;
          const balanceAfter = balanceBefore + payment.amountInCents;

          await tx.wallet.update({
            where: { userId: payment.userId },
            data: {
              balanceInCents: balanceAfter,
              totalDepositedInCents: { increment: payment.amountInCents },
            },
          });

          await tx.walletLedgerEntry.create({
            data: {
              walletId: wallet.id,
              type: 'DEPOSIT',
              amountInCents: payment.amountInCents,
              balanceBeforeInCents: balanceBefore,
              balanceAfterInCents: balanceAfter,
              reference: payment.reference,
              description: `Deposit via ${provider}`,
              metadata: { paymentId: payment.id, providerReference: verification.providerReference },
            },
          });
        });

        this.logger.log(
          `Payment confirmed: ${payment.id} | user=${payment.userId} | amount=${payment.amountInCents}`,
        );
      } else {
        this.logger.warn(
          `No matching payment found for webhook: ${verification.providerReference}`,
        );
      }
    }

    return { received: true };
  }
}

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
import { WalletService } from '../wallet/wallet.service';
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
    private readonly walletService: WalletService,
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

    const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from('');

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

    // Idempotency: check if this providerReference was already processed
    const existing = await this.prisma.payment.findFirst({
      where: { providerReference: verification.providerReference },
    });

    if (existing && existing.status === 'SUCCESS') {
      this.logger.log(
        `Idempotent: webhook for ${verification.providerReference} already processed`,
      );
      return { received: true, idempotent: true };
    }

    if (verification.status === 'SUCCESS') {
      // Find payment by provider reference or by amount proximity
      const payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { providerReference: verification.providerReference },
            {
              status: 'PENDING',
              amountInCents: verification.amountInCents,
              provider: provider as never,
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (payment) {
        await this.prisma.$transaction(async (tx) => {
          // Mark payment as completed
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              providerReference: verification.providerReference,
              webhookReceivedAt: new Date(),
            },
          });
        });

        // Credit wallet (outside the payment update tx so it uses the main wallet tx logic)
        await this.walletService.credit(
          payment.userId,
          payment.amountInCents,
          'DEPOSIT',
          payment.reference,
          `Deposit via ${provider}`,
          { paymentId: payment.id, providerReference: verification.providerReference },
        );

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

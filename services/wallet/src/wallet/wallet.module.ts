import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { InternalWalletController, InternalApiKeyGuard } from './wallet.internal.controller';
import { WalletService } from './wallet.service';
import { LedgerService } from '../ledger/ledger.service';
import { WebhookController } from '../payments/webhook.controller';
import { PaymentService } from '../payments/payment.service';
import { PayMongoAdapter } from '../payments/paymongo.adapter';
import { StripeAdapter } from '../payments/stripe.adapter';
import { XenditAdapter } from '../payments/xendit.adapter';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.getOrThrow<string>('JWT_SECRET'),
        verifyOptions: {
          issuer: 'panda-ng',
          audience: 'panda-ng-client',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WalletController, InternalWalletController, WebhookController],
  providers: [
    WalletService,
    LedgerService,
    InternalApiKeyGuard,
    PaymentService,
    PayMongoAdapter,
    StripeAdapter,
    XenditAdapter,
  ],
  exports: [WalletService],
})
export class WalletModule {}

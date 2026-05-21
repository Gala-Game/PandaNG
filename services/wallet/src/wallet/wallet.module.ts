import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { InternalWalletController } from './wallet.internal.controller';
import { WalletService } from './wallet.service';
import { LedgerService } from '../ledger/ledger.service';

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
  controllers: [WalletController, InternalWalletController],
  providers: [WalletService, LedgerService],
  exports: [WalletService],
})
export class WalletModule {}

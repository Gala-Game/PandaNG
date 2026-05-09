import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.getOrThrow<string>('JWT_SECRET'),
        verifyOptions: { issuer: 'panda-ng', audience: 'panda-ng-client' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FraudController],
  providers: [FraudService],
})
export class FraudModule {}

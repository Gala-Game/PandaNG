import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

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
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}

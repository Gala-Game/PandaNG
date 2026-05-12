import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JackpotController } from './jackpot.controller';
import { JackpotService } from './jackpot.service';
import { JackpotGateway } from './jackpot.gateway';
import { RedisService } from './redis.service';

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
  controllers: [JackpotController],
  providers: [JackpotService, JackpotGateway, RedisService],
})
export class JackpotModule {}

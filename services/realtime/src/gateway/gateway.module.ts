import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { PresenceService } from '../presence/presence.service';

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
  providers: [RealtimeGateway, PresenceService],
})
export class RealtimeGatewayModule {}

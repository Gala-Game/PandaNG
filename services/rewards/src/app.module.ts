import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RewardsModule } from './rewards/rewards.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    PrismaModule,
    RewardsModule,
  ],
})
export class AppModule {}

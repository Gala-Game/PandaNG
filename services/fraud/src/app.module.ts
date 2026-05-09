import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FraudModule } from './fraud/fraud.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    PrismaModule,
    FraudModule,
  ],
})
export class AppModule {}

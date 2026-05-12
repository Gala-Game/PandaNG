import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const corsOrigins = (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.enableShutdownHooks();

  // Health check — outside global prefix, no auth required (for load-balancer probes)
  app.getHttpAdapter().get('/health', (_req: unknown, res: { json: (data: object) => void }) => {
    res.json({ status: 'ok', service: 'realtime', timestamp: new Date().toISOString() });
  });

  const port = parseInt(process.env['PORT'] ?? '3004', 10);
  await app.listen(port);
  logger.log(`Realtime service running on port ${port}`);
}

void bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    // Disable body parser for webhook routes so we can access rawBody
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3002;
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  app.use(helmet());

  // Capture raw body for webhook signature verification, then parse JSON for all other routes
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/v1/wallet/webhook/')) {
      express.raw({ type: '*/*' })(req, res, (err) => {
        if (err) return next(err);
        (req as express.Request & { rawBody: Buffer }).rawBody = req.body as Buffer;
        next();
      });
    } else {
      express.json()(req, res, next);
    }
  });

  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PandaNG Wallet Service')
      .setDescription('Wallet, Balance & Ledger API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  // Health check — outside global prefix, no auth required (for load-balancer probes)
  app.getHttpAdapter().get('/health', (_req: unknown, res: { json: (data: object) => void }) => {
    res.json({ status: 'ok', service: 'wallet', timestamp: new Date().toISOString() });
  });

  await app.listen(port);
  logger.log(`Wallet service running on port ${port} [${nodeEnv}]`);
}

void bootstrap();

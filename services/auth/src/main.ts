import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  app.use(helmet());

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
      .setTitle('PandaNG Auth Service')
      .setDescription('Authentication & Authorization API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  // Health check — outside global prefix, no auth required (for load-balancer probes)
  app.getHttpAdapter().get('/health', (_req: unknown, res: { json: (data: object) => void }) => {
    res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() });
  });

  await app.listen(port);
  logger.log(`Auth service running on port ${port} [${nodeEnv}]`);
}

void bootstrap();

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Configure CORS with environment-based origins using ConfigService
  // This is moved to the top to ensure it handles preflight (OPTIONS) requests early
  const corsOriginsValue = configService.get<string>('CORS_ORIGINS');
  const corsOrigins = corsOriginsValue
    ? corsOriginsValue.split(',').map((origin) => {
        let trimmed = origin.trim();
        // Remove trailing slash if present
        if (trimmed.endsWith('/') && trimmed.length > 1) {
          trimmed = trimmed.slice(0, -1);
        }
        // If it's a domain without protocol, allow both http and https
        if (trimmed && !trimmed.startsWith('http') && trimmed !== '*') {
          return [`https://${trimmed}`, `http://${trimmed}`];
        }
        return trimmed;
      }).flat()
    : ['http://localhost:4200'];

  logger.log(`Allowed CORS origins: ${JSON.stringify(corsOrigins)}`);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, Origin, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Allow-Methods',
    exposedHeaders: 'Set-Cookie',
  });

  app.setGlobalPrefix('api/v1');
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(cookieParser());

  // Security headers - loosened slightly to prevent interference with API calls
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // CSP can sometimes block unexpected headers/requests
    }),
  );

  // Body size limits for large file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use(
    '/api/v1/uploads',
    express.static(path.join(process.cwd(), 'uploads')),
  );

  // Gzip compression
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend server is running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

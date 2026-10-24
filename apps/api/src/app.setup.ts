// Setup compartilhado entre `main.ts` e os testes e2e — T021.
// Sem `setGlobalPrefix`: o contrato usa `/auth`, `/vehicles` na raiz.
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { SESSION_COOKIE_NAME } from './common/auth/cookies.js';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const corsOrigins = config.getOrThrow<string[]>('CORS_ORIGINS');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // O Swagger UI (/docs) usa script/estilo inline; o resto segue o default do helmet.
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:'],
        },
      },
    }),
  );

  if (nodeEnv !== 'test') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DRIVO API')
      .setDescription(
        'Contrato executável. O contrato canônico de revisão vive em ' +
          'specs/001-drivo-vehicle-management/contracts/openapi.yaml.',
      )
      .setVersion('0.1.0')
      .addCookieAuth(SESSION_COOKIE_NAME)
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }
}

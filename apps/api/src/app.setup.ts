// Configuração HTTP compartilhada entre a aplicação e os testes E2E.
// Sem `setGlobalPrefix`: o contrato usa `/auth`, `/vehicles` na raiz.
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import { SESSION_COOKIE_NAME } from './common/auth/cookies.js';
import { SWAGGER_CSRF_SCRIPT } from './swagger/swagger-csrf-script.js';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const corsOrigins = config.getOrThrow<string[]>('CORS_ORIGINS');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');
  const port = config.getOrThrow<number>('PORT');

  // Swagger é servido pela própria API. Em desenvolvimento, permita também
  // essa origem no CORS antes de instalar o middleware.
  if (nodeEnv !== 'production' && nodeEnv !== 'test') {
    for (const origin of [`http://localhost:${port}`, `http://127.0.0.1:${port}`]) {
      if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
    }
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Confirm-Delete'],
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
    app.getHttpAdapter().get('/docs/swagger-csrf.js', (_request: Request, response: Response) => {
      response.type('application/javascript').send(SWAGGER_CSRF_SCRIPT);
    });

    const swaggerConfig = new DocumentBuilder()
      .setTitle('DRIVO API')
      .setDescription(
        'Contrato executável. O contrato canônico de revisão vive em ' +
          'specs/001-drivo-vehicle-management/contracts/openapi.yaml.',
      )
      .setVersion('0.1.0')
      .addServer(`http://localhost:${port}`, 'Local (API + Swagger na mesma origem)')
      .addCookieAuth(
        SESSION_COOKIE_NAME,
        {
          type: 'apiKey',
          in: 'cookie',
          description:
            'Sessão emitida por /auth/register ou /auth/login (HttpOnly). ' +
            'No Swagger UI o cookie é enviado automaticamente; fora dele use um cookie jar.',
        },
        'cookieAuth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description:
            'Eco exato do cookie CSRF (drivo_csrf ou __Host-drivo_csrf). ' +
            'Necessário em POST/PATCH/DELETE autenticados.',
        },
        'csrfToken',
      )
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      customJs: '/docs/swagger-csrf.js',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });
  }
}

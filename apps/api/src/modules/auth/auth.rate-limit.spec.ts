// Prova o 429 real no login: a 3ª tentativa na mesma janela é bloqueada pelo
// RateLimitGuard global (AUTH_THROTTLE_LIMIT). Sem banco: Prisma é um dublê.
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter.js';
import { CsrfGuard } from '../../common/guards/csrf.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';

const ORIGIN = 'http://localhost:3000';
const AUTH_LIMIT = 2;
const PASSWORD = 'senha-segura-123';

describe('Rate limit no login', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          ignoreEnvVars: true,
          validate: () => ({
            NODE_ENV: 'test',
            PORT: 3001,
            DATABASE_URL: 'postgresql://duble:duble@localhost:5433/drivo_test?schema=public',
            JWT_SECRET: 'j'.repeat(32),
            JWT_TTL_SECONDS: 3600,
            CSRF_SECRET: 'c'.repeat(32),
            COOKIE_SECURE: false,
            CORS_ORIGINS: [ORIGIN],
            THROTTLE_TTL_MS: 60_000,
            THROTTLE_LIMIT: 1000,
            AUTH_THROTTLE_LIMIT: AUTH_LIMIT,
          }),
        }),
        PrismaModule,
        AuthModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: CsrfGuard },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    })
      // Dublê: e-mail nunca encontrado → 401 nas tentativas admitidas.
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: async () => null } })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  function login() {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: 'ana@example.com', password: PASSWORD });
  }

  it('admite 2 tentativas e responde 429 RATE_LIMITED na terceira', async () => {
    await login().expect(401);
    await login().expect(401);

    const blocked = await login().expect(429);

    expect(blocked.body).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas tentativas. Tente novamente em instantes.',
      },
    });
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });
});

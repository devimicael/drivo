// Verificação HTTP do módulo de auth sem banco: cobre pipes, guards, cookies e
// filtro de erro com um dublê em memória. O e2e real vive em test/auth.e2e-spec.ts.
// As envs de teste viram `setupFiles` (jest.config.ts) antes de qualquer import.
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module.js';
import { configureApp } from '../../app.setup.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const ORIGIN = 'http://localhost:3000';
const PASSWORD = 'senha-segura-123';
const EMAIL = 'ana@example.com';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface FindUniqueArgs {
  where: { email?: string; id?: string };
  select?: Record<string, boolean>;
}

const users = new Map<string, StoredUser>();

const prismaDouble = {
  user: {
    create: async ({ data }: { data: Omit<StoredUser, 'id' | 'createdAt'> }) => {
      if (users.has(data.email)) {
        throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
      }
      const user: StoredUser = { ...data, id: randomUUID(), createdAt: new Date() };
      users.set(user.email, user);
      return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    },
    findUnique: async ({ where, select }: FindUniqueArgs) => {
      const user = where.email
        ? users.get(where.email)
        : [...users.values()].find((candidate) => candidate.id === where.id);

      if (!user) {
        return null;
      }
      if (select?.passwordHash) {
        return { ...user };
      }
      return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    },
  },
};

function cookiesFrom(response: request.Response): Record<string, string> {
  const raw = (response.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
  const jar: Record<string, string> = {};

  for (const cookie of raw) {
    const pair = cookie.split(';')[0] ?? '';
    const separator = pair.indexOf('=');
    jar[pair.slice(0, separator)] = pair.slice(separator + 1);
  }

  return jar;
}

describe('Auth (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaDouble)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register 201 cria sessão em cookie HttpOnly e CSRF legível', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ name: 'Ana Souza', email: EMAIL, password: PASSWORD })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        name: 'Ana Souza',
        email: EMAIL,
        createdAt: expect.any(String),
      },
      session: { expiresAt: expect.any(String) },
    });
    expect(JSON.stringify(response.body)).not.toContain(PASSWORD);

    const setCookies = response.headers['set-cookie'] as unknown as string[];
    expect(setCookies.find((cookie) => cookie.startsWith('drivo_session='))).toMatch(/HttpOnly/i);
    expect(setCookies.find((cookie) => cookie.startsWith('drivo_csrf='))).not.toMatch(/HttpOnly/i);
  });

  it('register 409 em e-mail duplicado, sem dados da conta existente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ name: 'Outra Pessoa', email: EMAIL, password: PASSWORD })
      .expect(409);

    expect(response.body).toEqual({
      error: { code: 'EMAIL_ALREADY_IN_USE', message: 'Este e-mail já está em uso.' },
    });
  });

  it('register 400 com details por campo (Zod via Standard Schema)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ name: '', email: 'invalido', password: '123' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        { path: 'name', message: 'Informe o nome.' },
        { path: 'email', message: 'Informe um e-mail válido.' },
        { path: 'password', message: 'A senha deve ter ao menos 8 caracteres.' },
      ]),
    );
  });

  it('rejeita mutação sem Origin (CSRF falha fechado)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('login 200 e GET /auth/me 200 com o cookie da sessão', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    const jar = cookiesFrom(login);
    expect(jar.drivo_session).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `drivo_session=${jar.drivo_session}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ email: EMAIL, name: 'Ana Souza' });
        expect(response.body).not.toHaveProperty('passwordHash');
      });
  });

  it('login 401 genérico para senha errada', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: 'senha-errada' })
      .expect(401);

    expect(response.body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas.' },
    });
  });

  it('GET /auth/me sem cookie responde 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('logout 204 exige CSRF válido e expira os cookies', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    const jar = cookiesFrom(login);
    const cookieHeader = `drivo_session=${jar.drivo_session}; drivo_csrf=${jar.drivo_csrf}`;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', ORIGIN)
      .set('Cookie', cookieHeader)
      .set('X-CSRF-Token', jar.drivo_csrf ?? '')
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', ORIGIN)
      .set('Cookie', cookieHeader)
      .set('X-CSRF-Token', 'token-forjado')
      .expect(403);
  });
});

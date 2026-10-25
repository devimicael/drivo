// E2E de autenticação — T028 (AC-01.1..3, AC-02.1..4, RN-11).
// Requer o PostgreSQL de teste (`drivo_test`, host 5433) e `prisma migrate deploy`.
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ORIGIN = 'http://localhost:3000';
const PASSWORD = 'senha-segura-123';
const EMAIL = `ana.${Date.now()}@example.com`;

function cookieHeader(response: request.Response): string {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  const session = cookies?.find((cookie) => cookie.startsWith('drivo_session='));

  if (!session) {
    throw new Error('Cookie de sessão ausente na resposta.');
  }

  return session.split(';')[0] ?? '';
}

function cookiePair(response: request.Response, name: string): string {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = cookies?.find((value) => value.startsWith(`${name}=`));
  if (!cookie) throw new Error(`Cookie ${name} ausente na resposta.`);
  return cookie.split(';')[0] ?? '';
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: EMAIL } });
    }
    await app?.close();
  });

  it('cadastro 201 devolve usuário e cookie HttpOnly, sem token no corpo (AC-01.1, AC-02.1)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ name: 'Ana Souza', email: EMAIL, password: PASSWORD })
      .expect(201);

    expect(response.body).toMatchObject({
      data: { name: 'Ana Souza', email: EMAIL },
      session: { expiresAt: expect.any(String) },
    });
    expect(JSON.stringify(response.body)).not.toContain(PASSWORD);
    expect(JSON.stringify(response.body)).not.toContain('token');

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const sessionCookie = cookies.find((cookie) => cookie.startsWith('drivo_session='));
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
    expect(cookies.some((cookie) => cookie.startsWith('drivo_csrf='))).toBe(true);
  });

  it('e-mail duplicado 409 sem vazar dados da conta existente (AC-01.2)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ name: 'Outra Pessoa', email: EMAIL, password: PASSWORD })
      .expect(409);

    expect(response.body).toEqual({
      error: { code: 'EMAIL_ALREADY_IN_USE', message: 'Este e-mail já está em uso.' },
    });
    expect(JSON.stringify(response.body)).not.toContain('Ana Souza');
  });

  it('payload inválido 400 com details por campo (AC-01.3)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ name: '', email: 'nao-e-email', password: '123' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.map((detail: { path: string }) => detail.path)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('login 200 inicia a sessão pelo cookie (AC-02.1)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    expect(response.body.data.email).toBe(EMAIL);
    expect(JSON.stringify(response.body)).not.toContain('token');
    expect(cookieHeader(response)).toMatch(/^drivo_session=/);
  });

  it('e-mail inexistente e senha errada produzem a mesma resposta 401 (AC-02.2, RN-11)', async () => {
    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: `ninguem.${Date.now()}@example.com`, password: PASSWORD })
      .expect(401);

    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: 'senha-errada' })
      .expect(401);

    expect(unknownEmail.body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas.' },
    });
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it('GET /auth/me 200 com sessão e 401 sem sessão (AC-02.3, AC-02.4)', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookieHeader(login))
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ email: EMAIL, name: 'Ana Souza' });
        expect(response.body).not.toHaveProperty('passwordHash');
      });

    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('logout limpa cookies de sessão e CSRF; as rotas privadas passam a retornar 401 (AC-03.1..3)', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    const session = cookiePair(login, 'drivo_session');
    const csrfCookie = cookiePair(login, 'drivo_csrf');
    const csrf = decodeURIComponent(csrfCookie.slice('drivo_csrf='.length));

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', ORIGIN)
      .set('Cookie', `${session}; ${csrfCookie}`)
      .set('X-CSRF-Token', csrf)
      .expect(204);
    const clearedCookies = logout.headers['set-cookie'] as unknown as string[];
    expect(clearedCookies.find((cookie) => cookie.startsWith('drivo_session='))).toMatch(/Expires=Thu, 01 Jan 1970/i);
    expect(clearedCookies.find((cookie) => cookie.startsWith('drivo_csrf='))).toMatch(/Expires=Thu, 01 Jan 1970/i);

    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer()).get('/vehicles').expect(401);
  });
});

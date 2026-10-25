import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const origin = 'http://localhost:3000';
const email = `profile.${Date.now()}@example.com`;
let app: INestApplication;
let prisma: PrismaService;
let auth: { Cookie: string; Origin: string; 'X-CSRF-Token': string };

describe('Users profile (e2e)', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email } });
    const registration = await request(app.getHttpServer()).post('/auth/register').set('Origin', origin)
      .send({ name: 'Perfil Inicial', email, password: 'senha-segura-123' }).expect(201);
    const cookies = registration.headers['set-cookie'] as unknown as string[];
    const session = cookies.find((cookie) => cookie.startsWith('drivo_session='))!.split(';')[0]!;
    const csrfCookie = cookies.find((cookie) => cookie.startsWith('drivo_csrf='))!.split(';')[0]!;
    auth = { Cookie: `${session}; ${csrfCookie}`, Origin: origin, 'X-CSRF-Token': decodeURIComponent(csrfCookie.split('=')[1]!) };
  });
  afterAll(async () => {
    if (prisma) await prisma.user.deleteMany({ where: { email } });
    await app?.close();
  });

  it('PATCH /users/me persists only the authenticated user name and returns a public user', async () => {
    const response = await request(app.getHttpServer()).patch('/users/me').set(auth).send({ name: 'Nome Atualizado' }).expect(200);
    expect(response.body).toMatchObject({ id: expect.any(String), name: 'Nome Atualizado', email });
    expect(response.body).not.toHaveProperty('passwordHash');
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', auth.Cookie).expect(200).expect(({ body }) => expect(body.name).toBe('Nome Atualizado'));
  });

  it.each(['', '   '])('rejects an empty profile name (%j)', async (name) => {
    const response = await request(app.getHttpServer()).patch('/users/me').set(auth).send({ name }).expect(400);
    expect(response.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'name' })]));
  });

  it('rejects email changes with the documented reason', async () => {
    const response = await request(app.getHttpServer()).patch('/users/me').set(auth).send({ name: 'Nome', email: 'new@example.com' }).expect(400);
    expect(response.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ message: 'O e-mail não pode ser alterado nesta versão.' })]));
  });

  it('requires authentication and CSRF to change a password', async () => {
    const body = { currentPassword: 'senha-segura-123', newPassword: 'nova-senha-segura-456' };
    await request(app.getHttpServer()).patch('/users/me/password').send(body).expect(401);
    await request(app.getHttpServer()).patch('/users/me/password').set('Cookie', auth.Cookie).send(body).expect(403);
  });

  it('rejects incorrect current passwords and invalid new passwords without changing the hash', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { email } });
    const response = await request(app.getHttpServer()).patch('/users/me/password').set(auth)
      .send({ currentPassword: 'incorrect', newPassword: 'nova-senha-segura-456' }).expect(400);
    expect(response.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
    for (const newPassword of ['short', 'senha-segura-123']) {
      await request(app.getHttpServer()).patch('/users/me/password').set(auth)
        .send({ currentPassword: 'senha-segura-123', newPassword }).expect(400);
    }
    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).passwordHash).toBe(before.passwordHash);
  });

  it('updates the password hash, rejects old credentials, accepts new credentials and keeps the current session', async () => {
    const response = await request(app.getHttpServer()).patch('/users/me/password').set(auth)
      .send({ currentPassword: 'senha-segura-123', newPassword: 'nova-senha-segura-456' }).expect(204);
    expect(response.text).toBe('');
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    expect(stored.passwordHash).not.toContain('nova-senha-segura-456');
    await request(app.getHttpServer()).post('/auth/login').set('Origin', origin).send({ email, password: 'senha-segura-123' }).expect(401);
    await request(app.getHttpServer()).post('/auth/login').set('Origin', origin).send({ email, password: 'nova-senha-segura-456' }).expect(200);
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', auth.Cookie).expect(200);
  });
});

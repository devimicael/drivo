import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { GeminiClient } from '../src/modules/crlv/gemini/gemini.client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createGeminiMock, geminiFailureCodes } from './gemini-mock.provider.js';

const origin = 'http://localhost:3000';
const email = `crlv.${Date.now()}@example.com`;
const gemini = createGeminiMock();
let app: INestApplication;
let prisma: PrismaService;
let auth: { Cookie: string; Origin: string; 'X-CSRF-Token': string };
let userCreated = false;
let userId: string;

describe('CRLV scan (e2e)', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GeminiClient).useValue(gemini).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    const registration = await request(app.getHttpServer()).post('/auth/register').set('Origin', origin)
      .send({ name: 'Teste CRLV', email, password: 'senha-segura-123' }).expect(201);
    userCreated = true;
    userId = registration.body.data.id as string;
    const cookies = (registration.headers['set-cookie'] as unknown as string[]).map((value) => value.split(';')[0]!);
    const session = cookies.find((value) => value.startsWith('drivo_session='))!;
    const csrfCookie = cookies.find((value) => value.startsWith('drivo_csrf='))!;
    const csrf = decodeURIComponent(csrfCookie.split('=')[1]!);
    auth = { Cookie: `${session}; ${csrfCookie}`, Origin: origin, 'X-CSRF-Token': csrf };
  });
  afterAll(async () => {
    if (prisma && userCreated) await prisma.user.deleteMany({ where: { email } });
    await app?.close();
  });

  it('returns extracted fields without creating a vehicle', async () => {
    gemini.extract.mockResolvedValue({ placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla', ano: 2022, chassi: '9BWZZZ377VT000001' });
    const before = await prisma.vehicle.count({ where: { userId } });
    const response = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth)
      .attach('file', Buffer.from('%PDF-1.7 sample'), { filename: 'crlv.pdf', contentType: 'application/pdf' }).expect(200);
    expect(response.body.data).toMatchObject({ extracted: { placa: 'ABC1D23', marca: 'Toyota' }, missingRequiredFields: [], source: 'GEMINI' });
    expect(await prisma.vehicle.count({ where: { userId } })).toBe(before);
  });

  it('rejects unsupported file before calling Gemini', async () => {
    gemini.extract.mockClear();
    const response = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth)
      .attach('file', Buffer.from('not a document'), { filename: 'file.exe', contentType: 'application/octet-stream' }).expect(400);
    expect(response.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
    expect(gemini.extract).not.toHaveBeenCalled();
  });

  it('requires a file and reports the stable error code', async () => {
    const response = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth).expect(400);
    expect(response.body.error.code).toBe('FILE_REQUIRED');
    expect(gemini.extract).not.toHaveBeenCalled();
  });

  it('rejects oversized and forged files before calling Gemini', async () => {
    gemini.extract.mockClear();
    const tooLarge = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth)
      .attach('file', Buffer.alloc(5_242_881), { filename: 'crlv.pdf', contentType: 'application/pdf' }).expect(400);
    expect(tooLarge.body.error.code).toBe('FILE_TOO_LARGE');
    const mismatch = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth)
      .attach('file', Buffer.from('%PNG'), { filename: 'crlv.pdf', contentType: 'application/pdf' }).expect(400);
    expect(mismatch.body.error.code).toBe('FILE_CONTENT_MISMATCH');
    expect(gemini.extract).not.toHaveBeenCalled();
  });

  it('reports every missing required field without filling any value', async () => {
    gemini.extract.mockResolvedValue({ marca: 'Toyota' });
    const response = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth)
      .attach('file', Buffer.from('%PDF-1.7 sample'), { filename: 'crlv.pdf', contentType: 'application/pdf' }).expect(200);
    expect(response.body.data.extracted).toEqual({ marca: 'Toyota' });
    expect(response.body.data.missingRequiredFields).toEqual(['placa', 'modelo', 'ano', 'chassi']);
  });

  it('normalizes Gemini failures and never returns provider details', async () => {
    for (const code of geminiFailureCodes) {
      gemini.failNext(code);
      const response = await request(app.getHttpServer()).post('/vehicles/scan-crlv').set(auth)
        .attach('file', Buffer.from('%PDF-1.7 sample'), { filename: 'crlv.pdf', contentType: 'application/pdf' }).expect(502);
      expect(response.body.error.code).toBe(code);
      expect(response.body.error.message).toBe('Falha na leitura automática. Preencha manualmente.');
      expect(response.body.error).not.toHaveProperty('stack');
    }
  });
});

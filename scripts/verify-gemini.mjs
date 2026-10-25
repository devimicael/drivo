// Verificação opt-in contra API, Postgres e Gemini reais. Usa somente dados sintéticos.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const apiRoot = new URL('apps/api/', root);
if (existsSync(new URL('.env', apiRoot))) process.loadEnvFile(fileURLToPath(new URL('.env', apiRoot)));
const api = process.env.VERIFY_API_URL ?? 'http://localhost:3001';
assert(['localhost', '127.0.0.1'].includes(new URL(api).hostname), 'Use uma API local de desenvolvimento.');
const origin = 'http://localhost:3000';
const email = `gemini-qa-${randomBytes(8).toString('hex')}@example.com`;
const password = randomBytes(24).toString('base64url');
let userId;
let cookie = '';
let csrf = '';

async function call(path, { method = 'GET', body, headers = {}, expected = 200 } = {}) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: { Origin: origin, ...(cookie ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const result = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${method} ${path}: HTTP ${response.status} (${result?.error?.code ?? 'erro inesperado'})`);
  return { response, result };
}

const started = Date.now();
try {
  const registration = await call('/auth/register', { method: 'POST', body: { name: 'Verificação Gemini', email, password }, expected: 201 });
  userId = registration.result.data.id;
  const cookies = registration.response.headers.getSetCookie().map(value => value.split(';')[0]);
  cookie = cookies.join('; ');
  csrf = decodeURIComponent(cookies.find(value => value.startsWith('drivo_csrf='))?.split('=')[1] ?? '');
  assert(csrf, 'Execute a verificação contra a API de desenvolvimento (COOKIE_SECURE=false).');
  const before = await call('/vehicles');
  const fixture = await readFile(new URL('apps/api/test/fixtures/crlv-sintetico.pdf', root));
  const form = new FormData();
  form.append('file', new Blob([fixture], { type: 'application/pdf' }), 'crlv-sintetico.pdf');
  const { result: scan } = await call('/vehicles/scan-crlv', { method: 'POST', body: form });
  assert.deepEqual(scan.data.missingRequiredFields, []);
  assert.equal(scan.data.extracted.placa, 'DQA1A23');
  assert.equal(scan.data.extracted.chassi, '9BWZZZ377VT004251');
  assert.equal(scan.data.extracted.ano, 2023);
  assert.equal((await call('/vehicles')).result.meta.total, before.result.meta.total);
  const { result: vehicle } = await call('/vehicles', { method: 'POST', body: { ...scan.data.extracted, modelo: 'Corolla revisado' }, expected: 201 });
  assert.equal(vehicle.modelo, 'Corolla revisado');
  const { result: edited } = await call(`/vehicles/${vehicle.id}`, { method: 'PATCH', body: { cor: 'Azul' } });
  assert.equal(edited.cor, 'Azul');
  assert.equal((await call('/vehicles?search=DQA-1A23')).result.data[0].id, vehicle.id);
  await call(`/vehicles/${vehicle.id}`, { method: 'DELETE', expected: 400 });
  await call(`/vehicles/${vehicle.id}`, { method: 'DELETE', headers: { 'X-Confirm-Delete': 'true' }, expected: 204 });
  assert.equal((await call('/vehicles')).result.meta.total, before.result.meta.total);
  assert.equal((await call('/users/me', { method: 'PATCH', body: { name: 'Perfil verificado' } })).result.name, 'Perfil verificado');
  const { response: logout } = await call('/auth/logout', { method: 'POST', expected: 204 });
  assert(logout.headers.getSetCookie().some(value => value.includes('drivo_session=;')));
  cookie = '';
  csrf = '';
  await call('/auth/me', { expected: 401 });
  const evidence = { verifiedAt: new Date().toISOString(), durationMs: Date.now() - started,
    fixture: 'crlv-sintetico.pdf (sem dados pessoais)', provider: 'Gemini real',
    checks: ['cadastro', 'extração real de PDF', 'nenhuma persistência antes de confirmar',
      'revisão e criação explícita', 'busca com hífen', 'edição', 'exclusão exige confirmação', 'perfil', 'logout'],
    result: 'passed' };
  await mkdir(new URL('docs/evidence/', root), { recursive: true });
  await writeFile(new URL('docs/evidence/gemini-verification.json', root), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  if (userId) {
    const requireApi = createRequire(new URL('package.json', apiRoot));
    const { PrismaPg } = await import(pathToFileURL(requireApi.resolve('@prisma/adapter-pg')));
    const { PrismaClient } = await import(new URL('dist/generated/prisma/client.js', apiRoot));
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    try { await prisma.user.deleteMany({ where: { id: userId, email } }); }
    finally { await prisma.$disconnect(); }
    console.log('Conta temporária removida.');
  }
}

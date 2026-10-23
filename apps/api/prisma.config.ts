// Configuração do Prisma 7 (ESM). A URL do banco vive AQUI, não no schema.
// Fonte: plan.md §Technical Context (Prisma 7 + prisma.config.ts + driver adapter).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 não carrega .env automaticamente (e o Nest também não). Carregamos o
// apps/api/.env para `pnpm db:*` funcionar sem exportar variáveis na mão.
// `loadEnvFile` não sobrescreve variáveis já presentes — no Docker, o build usa
// o placeholder do Dockerfile e o runtime usa o env do compose.
const localEnv = path.resolve('.env');
if (existsSync(localEnv)) {
  loadEnvFile(localEnv);
}

export default defineConfig({
  schema: path.resolve('prisma/schema.prisma'),
  migrations: {
    path: path.resolve('prisma/migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

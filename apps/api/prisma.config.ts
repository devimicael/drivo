// Configuração do Prisma 7 (ESM). A URL do banco vive AQUI, não no schema.
// Fonte: plan.md §Technical Context (Prisma 7 + prisma.config.ts + driver adapter).
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: path.resolve('prisma/schema.prisma'),
  migrations: {
    path: path.resolve('prisma/migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

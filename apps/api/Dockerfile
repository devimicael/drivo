# Multi-stage para apps/api (NestJS 12, ESM).
# ⚠️ Contexto de build é a RAIZ do monorepo (pnpm workspaces precisa do lockfile).
# Ordem obrigatória: prisma generate ANTES de nest build (plan.md §Strategy).
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter drivo-api
COPY apps/api ./apps/api
# env('DATABASE_URL') no prisma.config.ts é validado mesmo no `generate`.
# Build não toca o banco: placeholder; o runtime recebe a URL real pelo compose.
ENV DATABASE_URL=postgresql://build-placeholder:build-placeholder@localhost:5432/build-placeholder
RUN pnpm --filter drivo-api prisma:generate
RUN pnpm --filter drivo-api build
RUN pnpm --filter drivo-api --prod deploy /app/exe

FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /app
COPY --from=build /app/exe ./
USER node
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]

# Multi-stage para apps/web (Next.js 16).
# ⚠️ Contexto de build é a RAIZ do monorepo. NEXT_PUBLIC_* é inline no build (build args).
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter drivo-web
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter drivo-web build

FROM node:22-alpine AS runtime
RUN corepack enable
# Preserva a hierarquia do workspace: os symlinks pnpm de apps/web/node_modules
# são RELATIVOS a /repo/node_modules — copiar para /app quebra a resolução.
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/apps/web/node_modules /repo/apps/web/node_modules
COPY --from=build /repo/apps/web/.next /repo/apps/web/.next
COPY --from=build /repo/apps/web/public /repo/apps/web/public
COPY --from=build /repo/apps/web/package.json /repo/apps/web/package.json
COPY --from=build /repo/apps/web/next.config.ts /repo/apps/web/next.config.ts
WORKDIR /repo/apps/web
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]

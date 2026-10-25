#!/bin/sh
# Entrypoint da API no Compose.
# Objetivo: `docker compose up --build` funciona em clone limpo, sem `pnpm setup`.
# Se os segredos não vierem do ambiente nem de apps/api/.env, geramos valores
# aleatórios só para ESTA execução (sessões não sobrevivem a um restart).
# Em produção real, defina JWT_SECRET e CSRF_SECRET próprios (>= 32 caracteres).
set -e

if [ -z "${JWT_SECRET:-}" ]; then
  JWT_SECRET="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"
  export JWT_SECRET
  echo "[entrypoint] JWT_SECRET ausente: valor aleatório gerado para esta execução."
fi

if [ -z "${CSRF_SECRET:-}" ]; then
  CSRF_SECRET="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"
  export CSRF_SECRET
  echo "[entrypoint] CSRF_SECRET ausente: valor aleatório gerado para esta execução."
fi

./node_modules/.bin/prisma migrate deploy
exec node dist/main.js

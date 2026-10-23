# drivo-api

API REST do DRIVO (NestJS 12 + Prisma 7 + PostgreSQL 16).

Instalação, execução, variáveis de ambiente, decisões técnicas e limitações estão no
[README da raiz](../../README.md).

Comandos rápidos (a partir da raiz do monorepo):

```bash
pnpm dev:api        # watch em http://localhost:3001
pnpm test           # unitários (Jest)
pnpm test:e2e       # e2e (PostgreSQL isolado, Gemini mockado)
pnpm db:migrate     # aplica migrations
```

# DRIVO

Garagem pessoal de veículos com **importação de CRLV assistida por IA**: o usuário fotografa
ou envia o PDF do documento e o Gemini extrai os campos, que voltam para revisão humana antes
de qualquer gravação.

Monorepo fullstack — **Next.js 16** (web) + **NestJS 12** (API) + **PostgreSQL 16** + **Prisma 7**,
orquestrado por **Docker Compose** com um único comando.

> Desafio técnico fullstack (prazo de 5 dias). A interface segue o protótipo do Figma indicado
> no desafio (fidelidade visual é diferencial da avaliação).

---

## Status atual

| Fase | Escopo | Status |
| --- | --- | --- |
| Setup | Monorepo pnpm, ambientes por app, Compose, Prisma 7 + migration inicial, imagens Docker | ✅ concluída |
| Foundational | Validação de env (Zod), `PrismaService` com driver adapter, guards JWT/CSRF/rate-limit, filtro de erro único, Swagger | ✅ concluída (Swagger via factory entra com os recursos) |
| US1 | Cadastro, login, sessão e logout (API + telas) | ✅ concluída |
| US2 | Garagem: listar, pesquisar, criar veículo | ⚠️ API concluída (16 e2e); telas pendentes |
| US3 | Importação de CRLV (upload → Gemini → revisão → confirmação) | ⏳ |
| US4–US6 | Editar/excluir veículo, perfil, polimento e documentação final | ⏳ |

Este README é atualizado a cada fase; o status acima reflete o commit atual. A tabela de
endpoints marca o que já está disponível.

---

## Sumário

- [Sobre o desafio](#sobre-o-desafio)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Portas e comunicação](#portas-e-comunicação)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como executar](#como-executar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API REST](#api-rest)
- [Como executar os testes](#como-executar-os-testes)
- [Decisões técnicas](#decisões-técnicas)
- [Limitações](#limitações)
- [O que seria feito com mais tempo](#o-que-seria-feito-com-mais-tempo)
- [Problemas comuns](#problemas-comuns)
- [Referências](#referências)

---

## Sobre o desafio

O DRIVO permite montar uma garagem pessoal com apoio de IA. O usuário deve conseguir:

1. Fazer cadastro e login (JWT);
2. Visualizar seus veículos;
3. Pesquisar por placa, marca, modelo ou ano;
4. Criar um veículo manualmente;
5. **Importar um CRLV** (imagem ou PDF) e ter os campos preenchidos automaticamente pelo
   **Gemini** (API gratuita);
6. Revisar/editar os dados extraídos antes de salvar;
7. Editar e excluir veículos;
8. Alterar os dados cadastrais (nome);
9. Fazer logout.

Requisitos obrigatórios do teste atendidos: Next.js, NestJS, Tailwind CSS, PostgreSQL,
Docker, API REST em JSON, autenticação JWT e uso do Gemini para leitura do CRLV.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Web | Next.js 16.4.2 (App Router, PPR), React 19, TypeScript, Tailwind CSS v4 |
| Web — formulários/dados | React Hook Form, Zod 4, TanStack Query, Material Symbols Rounded |
| API | NestJS 12 (ESM), TypeScript, Zod 4 (validação), Swagger |
| Banco | PostgreSQL 16 + Prisma 7 (`prisma-client` + driver adapter `@prisma/adapter-pg`) |
| IA | `@google/genai` 2.30.0 — **somente no backend** |
| Segurança | Argon2id (`@node-rs/argon2`), JWT HS256 em cookie `httpOnly`, CSRF double-submit, helmet, rate limiting |
| Testes | Jest + Supertest (API), Vitest + Testing Library (web) |
| Infra | pnpm workspaces, Docker multi-stage, Docker Compose |

Versões são **pinadas** (sem `latest`) e existe **um único `pnpm-lock.yaml`** na raiz.

---

## Arquitetura

```
drivo/
├── apps/
│   ├── api/                 # NestJS 12 — REST, JWT, Prisma, integração Gemini
│   │   ├── prisma/          # schema.prisma + migrations versionadas
│   │   ├── src/
│   │   │   ├── common/      # filtro global, guards, decorators
│   │   │   ├── config/      # schema Zod do ambiente + configuration
│   │   │   ├── prisma/      # PrismaService (único acesso ao banco)
│   │   │   └── modules/     # auth, users, vehicles, crlv
│   │   ├── test/            # e2e (PostgreSQL isolado a partir de T026, Gemini mockado)
│   │   ├── .env.example
│   │   └── Dockerfile
│   └── web/                 # Next.js 16 — App Router em src/app
│       ├── src/
│       │   ├── app/         # rotas (públicas e protegidas)
│       │   ├── components/  # UI reutilizável
│       │   ├── features/    # auth, garage, import, profile
│       │   ├── hooks/       # hooks de dados (TanStack Query)
│       │   ├── lib/         # api.ts (cliente HTTP), query-client.ts
│       │   ├── schemas/     # Zod compartilhado nos formulários
│       │   └── middleware.ts# redireciona por cookie (conveniência, não segurança)
│       ├── .env.example
│       └── Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json             # apenas scripts de orquestração
├── pnpm-lock.yaml
├── scripts/setup-env.mjs    # gera os ambientes locais (`pnpm setup`)
└── README.md
```

**Responsabilidades por camada**

| Camada | Faz | Não faz |
| --- | --- | --- |
| Controller (API) | HTTP, status, cookies, delegação | Regra de negócio, banco |
| Service (API) | Regra de aplicação e **autorização por `userId`** | Manipular `req`/`res` |
| Prisma (API) | Persistência (única camada que fala com o banco) | Regra de negócio |
| `GeminiClient` | Comunicação com o Gemini | Persistir, conter regra |
| `lib/api.ts` (web) | Transporte HTTP, cookies, normalização de erro | Renderização |
| Componentes (web) | Apresentação e interação | Acessar `fetch` direto |

O browser fala **direto** com a API (`credentials: 'include'`, CORS explícito) — não há BFF.
A API é a única barreira de segurança; o `middleware.ts` do Next só redireciona.

---

## Portas e comunicação

| Serviço | Host | Dentro da rede Docker |
| --- | --- | --- |
| Web | `http://localhost:3000` | `http://web:3000` |
| API | `http://localhost:3001` | `http://api:3001` |
| PostgreSQL | `localhost:5433` | `postgres:5432` |

- O **browser** acessa a API em `http://localhost:3001` (`NEXT_PUBLIC_API_URL`).
- O **container da API** acessa o banco em `postgres:5432` (o Compose sobrescreve `DATABASE_URL`).
- A porta **5433** no host existe porque um serviço PostgreSQL do Windows já ocupa a 5432
  nesta máquina; dentro do Compose nada muda.

---

## Pré-requisitos

| Ferramenta | Versão |
| --- | --- |
| Node.js | **≥ 22.12** (testado com 24.x) |
| pnpm | **12.14.0** (`corepack enable` ou instalação global) |
| Docker | Docker Desktop / Engine com Compose v2 |

---

## Instalação

```bash
git clone https://github.com/devimicael/drivo.git
cd drivo

# 1. Dependências (um único lockfile para o monorepo)
pnpm install

# 2. Ambientes locais (cria apps/api/.env e apps/web/.env.local
#    e gera JWT_SECRET/CSRF_SECRET aleatórios)
pnpm setup
```

`pnpm setup` não sobrescreve arquivos existentes. Se preferir criar na mão:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

---

## Como executar

### Opção 1 — Docker Compose (comando único)

```bash
docker compose up --build
```

O Compose sobe, nesta ordem:

```
postgres (postgres:16-alpine, healthcheck pg_isready)
  └─> api  (prisma migrate deploy → node dist/main.js, porta 3001)
        └─> web (next start, porta 3000)
```

- **Migrações são aplicadas automaticamente** no entrypoint da API (`prisma migrate deploy`).
- Acesse: **web** http://localhost:3000 · **API** http://localhost:3001 ·
  **Swagger** http://localhost:3001/docs (quando a fase foundational estiver concluída).
- Em segundo plano: `docker compose up -d --build`; logs: `docker compose logs -f`.
- Parar: `docker compose down` (mantém o volume do banco).
  Apagar **também os dados**: `docker compose down -v`.

### Opção 2 — Desenvolvimento local (hot reload)

```bash
# banco em container
docker compose up -d postgres

# API em watch (http://localhost:3001)
pnpm dev:api

# web em watch (http://localhost:3000) — em outro terminal
pnpm dev:web
```

### Banco e migrações

```bash
pnpm db:generate      # regenera o Prisma Client em apps/api/src/generated/prisma
pnpm db:migrate       # aplica migrations (deploy) usando apps/api/.env
pnpm db:migrate:dev   # cria nova migration em desenvolvimento
```

O CLI do Prisma carrega `apps/api/.env` automaticamente (via `prisma.config.ts`), então não é
preciso exportar `DATABASE_URL` na mão.

### Build de produção

```bash
pnpm build            # build da API (nest) e da web (next)
```

---

## Variáveis de ambiente

Cada aplicação tem o seu ambiente — **a raiz não tem `.env`**. Os templates versionados são
`apps/api/.env.example` e `apps/web/.env.example`; nenhum segredo real é versionado.

### `apps/api/.env`

| Variável | Obrigatória | Padrão | Efeito |
| --- | --- | --- | --- |
| `NODE_ENV` | sim | `development` | `production` ativa cookies `Secure` |
| `PORT` | sim | `3001` | Porta da API |
| `DATABASE_URL` | sim | — | Conexão Prisma (host: `localhost:5433`) |
| `JWT_SECRET` | sim | — | Assina o JWT (mín. 32 caracteres) |
| `JWT_TTL_SECONDS` | não | `3600` | Expiração da sessão |
| `CSRF_SECRET` | sim | — | HMAC do CSRF (distinto do JWT) |
| `CORS_ORIGINS` | sim | `http://localhost:3000` | Origens permitidas |
| `COOKIE_SECURE` | não | derivado de `NODE_ENV` | Força/desliga `Secure` |
| `GOOGLE_API_KEY` | **não** | vazio | Sem a chave a API **sobe**; o import responde 502 controlado |
| `GEMINI_MODEL` | não | `gemini-2.5-flash` | Modelo usado na extração |
| `GEMINI_TIMEOUT_MS` | não | `30000` | Timeout da chamada externa |
| `UPLOAD_MAX_BYTES` | não | `5242880` | Limite de upload (5 MB) |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | não | `60000` / `120` | Rate limit global |
| `AUTH_THROTTLE_LIMIT` | não | `5` | Limite em login/cadastro |
| `SCAN_THROTTLE_LIMIT` | não | `10` | Limite em `scan-crlv` |

### `apps/web/.env.local`

| Variável | Obrigatória | Exemplo | Efeito |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | sim | `http://localhost:3001` | URL da API usada pelo browser (embutida no bundle em build time) |

> A chave do Gemini fica **apenas** no backend. Nada de `GOOGLE_API_KEY` no frontend, em logs
> ou em mensagens de erro.

---

## API REST

- Base: `http://localhost:3001`
- Sessão: JWT HS256 em cookie **`drivo_session`** (`httpOnly`, `SameSite=Lax`). O token nunca
  aparece no corpo JSON nem é acessível ao JavaScript do browser.
- CSRF: double-submit — cookie `drivo_csrf` em dev (`__Host-drivo_csrf` em produção, com
  `Secure`) + header `X-CSRF-Token`.
- Erros: envelope único, sem stack trace nem detalhes internos (implementado na fase
  foundational):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.", "details": [] } }
```

| Método | Rota | Descrição | Status |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Cadastro | ✅ |
| `POST` | `/auth/login` | Login (mensagem idêntica para e-mail/senha inválidos) | ✅ |
| `POST` | `/auth/logout` | Logout (limpa cookies) | ✅ |
| `GET` | `/auth/me` | Sessão atual | ✅ |
| `PATCH` | `/users/me` | Alterar nome | ⏳ |
| `GET` | `/vehicles` | Listar/pesquisar (`?search=`) | ✅ |
| `POST` | `/vehicles` | Criar veículo | ✅ |
| `GET` | `/vehicles/{id}` | Detalhe | ✅ |
| `PATCH` | `/vehicles/{id}` | Editar | ✅ |
| `DELETE` | `/vehicles/{id}` | Excluir (exige `X-Confirm-Delete: true`) | ✅ |
| `POST` | `/vehicles/scan-crlv` | Upload do CRLV → campos extraídos pelo Gemini | ⏳ |

Códigos de erro estáveis: `VALIDATION_ERROR`, `EMAIL_ALREADY_IN_USE`, `PLATE_ALREADY_EXISTS`,
`CONFIRMATION_REQUIRED`, `FILE_REQUIRED`, `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE`,
`FILE_CONTENT_MISMATCH`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`RATE_LIMITED`, `GEMINI_TIMEOUT`, `GEMINI_UNAVAILABLE`, `GEMINI_QUOTA_EXCEEDED`,
`GEMINI_INVALID_RESPONSE`, `INTERNAL_ERROR`.

**Modelo de dados** (migration `20261021220906_init`): `users` (id, nome, e-mail único,
`passwordHash`) e `vehicles` (placa única **por usuário**, marca, modelo, ano, chassi, campos
opcionais, `origem` `MANUAL`/`CRLV` e colunas normalizadas `modeloBusca`/`marcaBusca` para
pesquisa sem acento e sem caixa). **Nenhum arquivo de CRLV é persistido** — o upload vive
apenas em memória durante a extração.

---

## Como executar os testes

```bash
# API — unitários (Jest)
pnpm test

# API — um arquivo específico
pnpm --filter drivo-api test -- src/app.controller.spec.ts

# API — cobertura
pnpm test:cov

# API — e2e (Supertest; PostgreSQL isolado a partir de T026; Gemini SEMPRE mockado)
pnpm test:e2e

# Web — Vitest + Testing Library
pnpm test:web

# Qualidade
pnpm lint             # API: oxlint --type-aware · Web: ESLint
pnpm build            # type-check de produção das duas apps
```

Regras da suíte: o Gemini **nunca** é chamado de verdade nos testes (5 cenários de falha
simulados) e o e2e roda contra um PostgreSQL real e isolado (`drivo_test`, criado pelo init
script do Compose), sem tocar no banco de desenvolvimento.

---

## Decisões técnicas

1. **Monorepo pnpm com lockfile único.** Um só `pnpm-lock.yaml` evita divergência de
   dependências entre web e API; cada app mantém seu `package.json` e seu ambiente.
2. **Ambientes por aplicação.** `apps/api/.env` (segredos/banco) e `apps/web/.env.local`
   (URL pública). A raiz só orquestra. `pnpm setup` gera segredos fortes no primeiro uso.
3. **Next.js 16 com App Router e PPR.** `cacheComponents` + `partialPrefetching` deixam o
   carregamento de dados explícito (Suspense/cache), evitando fetch dinâmico escondido.
4. **NestJS 12 em ESM.** `"type": "module"` e imports relativos com `.js` (nodenext), o que
   mantém compatibilidade com o Prisma 7.
5. **Prisma 7 com driver adapter (`PrismaPg`).** Sem engine binária no runtime; a URL fica em
   `prisma.config.ts`, e o CLI carrega `apps/api/.env` explicitamente.
6. **Zod como validação única.** O mesmo schema valida env, DTOs e formulários (`.strict()`
   bloqueia mass assignment, inclusive `userId` vindo do cliente).
7. **Sessão em cookie `httpOnly` + CSRF double-submit.** Nada de token em `localStorage`;
   o CSRF tem duas camadas (origem + HMAC ligado ao `jti` da sessão).
8. **Argon2id** para senhas (`m=19MiB, t=2, p=1`), com mensagem de erro idêntica para e-mail
   inexistente e senha errada.
9. **Autorização sempre no service, por `userId`.** Recurso de outro usuário responde o mesmo
   `404` de recurso inexistente (não vaza existência).
10. **Gemini só no backend**, com timeout, validação da resposta e mapeamento de falhas para
    502 controlado; o arquivo nunca é gravado e o mock é obrigatório nos testes.
11. **Docker multi-stage com contexto na raiz.** Necessário para o pnpm workspace (lockfile +
    manifests); `prisma generate` roda antes do `nest build`; runtime da web preserva a
    hierarquia `/repo/apps/web` por causa dos symlinks relativos do pnpm.
12. **Portas invertidas em relação ao padrão**: API **3001** e web **3000** (o Next já usa
    3000 por padrão); Postgres no host em **5433** por conflito com um serviço local.

---

## Limitações

- **Fora de escopo declarado**: alteração de e-mail, recuperação de senha, verificação por
  e-mail, foto do veículo e exportação do CRLV.
- Sessão com expiração fixa (`JWT_TTL_SECONDS`), **sem refresh token** nem renovação deslizante.
- Listagem de veículos **sem paginação** (volume esperado: garagem pessoal).
- Rate limiting em memória — adequado a uma instância; em múltiplas réplicas precisaria de
  store compartilhado (ex.: Redis).
- Importação limitada a **1 arquivo** por vez, JPEG/PNG/WebP/PDF até **5 MB**; a qualidade da
  extração depende da legibilidade do documento e da cota gratuita do Gemini.
- O prefixo `__Host-` do cookie de CSRF só é usado em produção (exige `Secure`); em
  `http://localhost` o cookie é `drivo_csrf` sem prefixo.
- A fonte **Material Symbols Rounded** é variável e inclui todos os ícones (~5 MB); para
  produção convém subsetar apenas os glifos usados.
- Sem CI/CD configurado; verificações são locais (`pnpm lint`, `pnpm test`, `pnpm build`).

---

## O que seria feito com mais tempo

- **Sessões robustas**: refresh token com rotação, revogação por dispositivo e tabela de
  sessões; hoje o logout limpa o cookie, mas não há lista de sessões ativas.
- **Testes de interface** com Playwright (fluxo completo: cadastro → CRLV → revisão → garagem)
  e testes de acessibilidade automatizados.
- **CI/CD** (GitHub Actions): lint + testes + build + imagem Docker a cada push, com cache de
  dependências.
- **Observabilidade**: logs estruturados com correlação de requisição, métricas de latência e
  alerta para falhas do Gemini.
- **Upload mais resiliente**: pré-processamento da imagem (recorte/rotação), suporte a múltiplas
  páginas de PDF e fallback de modelo.
- **Paginação, ordenação e filtros** na garagem; busca com `pg_trgm`/full-text para volumes
  maiores.
- **Performance de assets**: subsetar a fonte Material Symbols e usar `next/font` com
  `display: swap`; hoje a fonte variável completa (~5 MB) é self-hosted.
- **Deploy** com HTTPS real (cookies `__Host-` completos), backup do volume e migrações em
  pipeline separado.

---

## Problemas comuns

| Sintoma | Causa / solução |
| --- | --- |
| `port is already allocated` na 5433 | Outro Postgres local. Pare-o ou ajuste o mapeamento no `docker-compose.yml`. |
| `DATABASE_URL` ausente ao rodar `pnpm db:*` | Rode `pnpm setup` (cria `apps/api/.env`). |
| API sobe mas login falha com 500 | Falta `JWT_SECRET`/`CSRF_SECRET` válidos (≥ 32 chars) em `apps/api/.env`. |
| Importação responde 502 | `GOOGLE_API_KEY` ausente/inválida ou cota gratuita esgotada — é o comportamento esperado e controlado. |
| Cookie não é enviado em produção | `COOKIE_SECURE=true` exige HTTPS; em `http://localhost` use `false`. |
| Web não enxerga a API | `NEXT_PUBLIC_API_URL` é embutida no **build**; após mudar, rode `docker compose up --build` (ou reinicie o `next dev`). |
| Quero zerar o banco | `docker compose down -v` (apaga o volume `drivo_pgdata`) e suba de novo. |
| `drivo_test` não existe no e2e | O init script só roda em volume vazio: `docker compose down -v && docker compose up -d postgres`. |
| Docker daemon não responde | Abra o Docker Desktop e aguarde o engine iniciar. |

---

## Referências

- Protótipo (Figma): https://www.figma.com/design/kMDaB78808CbApQRhg8kVF/Teste-Full-Stack-Junior-1
- Documentação da API: Swagger em `http://localhost:3001/docs` (quando a API estiver rodando).

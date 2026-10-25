# DRIVO

Garagem pessoal de veículos com **importação de CRLV assistida por IA**: o usuário fotografa
ou envia o PDF do documento e o Gemini extrai os campos, que voltam para revisão humana antes
de qualquer gravação.

Monorepo fullstack — **Next.js 16** (web) + **NestJS 12** (API) + **PostgreSQL 16** + **Prisma 7**,
orquestrado por **Docker Compose** com um único comando.

---

## Status atual

| Fase | Escopo | Status |
| --- | --- | --- |
| Setup | Monorepo pnpm, ambientes por app, Compose, Prisma 7 + migration inicial, imagens Docker | ✅ concluída |
| Foundational | Validação de env (Zod), `PrismaService` com driver adapter, guards JWT/CSRF/rate-limit, filtro de erro único, Swagger | ✅ concluída (Swagger em `/docs`) |
| US1 | Cadastro, login, sessão e logout (API + telas) | ✅ concluída |
| US2 | Garagem: listar, pesquisar, criar veículos (API + telas) | ✅ concluída |
| US3 | Importação de CRLV (upload → Gemini → revisão → confirmação) | ✅ concluída |
| US4 | Editar/excluir veículos com confirmação (API + telas) | ✅ concluída |
| US5 | Logout e sessão expirada | ✅ concluída |
| US6 | Nome/sobrenome, alteração de senha e saída pelo perfil | ✅ concluída |
| Polish | README, Swagger, testes finais e revisão visual | ✅ concluída (capturas desktop/móvel e conferência final no Figma) |

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
- [Uso de IA no desenvolvimento](#uso-de-ia-no-desenvolvimento)
- [Fidelidade visual ao Figma](#fidelidade-visual-ao-figma)
- [Segurança](#segurança)
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
│   │   ├── test/            # e2e com PostgreSQL isolado e Gemini mockado
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
│       │   └── proxy.ts     # redireciona por cookie (conveniência, não segurança — Next 16)
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
A API é a única barreira de segurança; o `proxy.ts` do Next só redireciona.

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

| Ferramenta | Versão | Necessária para |
| --- | --- | --- |
| Docker | Docker Desktop / Engine com Compose v2 | **só isto** para a Opção A (`docker compose up --build`) |
| Node.js | **≥ 22.12** (testado com 24.x) | desenvolvimento local e testes |
| pnpm | **12.14.0** (`corepack enable` ou instalação global) | desenvolvimento local e testes |

---

## Instalação

### Opção A — só executar (Docker), sem instalar nada no host

```bash
git clone https://github.com/devimicael/drivo.git
cd drivo
docker compose up --build
```

Em clone limpo não é necessário executar `pnpm setup` nem copiar `.env`: ambos os arquivos
de ambiente são opcionais no Compose. Sem `apps/api/.env`, o entrypoint gera segredos
temporários para a execução; reiniciar a API encerra as sessões existentes. Para persistir
configurações locais ou usar o Gemini, copie `apps/api/.env.example` para
`apps/api/.env`, configure `GOOGLE_API_KEY` e rode novamente `docker compose up --build`.
O frontend pode usar `apps/web/.env.example` como `apps/web/.env.local` se quiser alterar a
URL pública da API.

Não é preciso `pnpm install`, `pnpm setup`, `apps/api/.env` nem `node_modules` no host:
se os segredos não existirem, o entrypoint da API gera `JWT_SECRET`/`CSRF_SECRET`
aleatórios **por execução** (sessões caem a cada restart — suficiente para avaliar).

### Opção B — desenvolvimento local (hot reload)

```bash
pnpm install
pnpm setup   # cria apps/api/.env e apps/web/.env.local com segredos aleatórios
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
  **Swagger** http://localhost:3001/docs.
- Em segundo plano: `docker compose up -d --build`; logs: `docker compose logs -f`.
- Parar: `docker compose down` (mantém o volume do banco).
  Apagar **também os dados**: `docker compose down -v`.
- O Compose já define valores de avaliação: `COOKIE_SECURE=false` (o app roda em
  `http://localhost`), `CORS_ORIGINS` com web **e** API, e rate limit folgado
  (`AUTH_THROTTLE_LIMIT=20`). Em produção real, use HTTPS e `COOKIE_SECURE=true`.

#### Chave do Gemini (opcional, só para a importação de CRLV)

Sem a chave a aplicação **sobe normalmente**: cadastro, login e garagem funcionam, e a
tela de importação mostra um aviso amigável ("não foi possível ler o documento, preencha
manualmente") — nada quebra. Para habilitar a leitura automática:

```bash
cp apps/api/.env.example apps/api/.env
# edite GOOGLE_API_KEY com a chave do Google AI Studio
docker compose up --build
```

A chave fica **apenas** na API. Também é possível importar um veículo manualmente sem
chave nenhuma.

#### Swagger com "Try it out"

1. Abra http://localhost:3001/docs.
2. Em `POST /auth/register` (ou `/auth/login`), clique em **Try it out** → **Execute**.
3. O cookie de sessão (`httpOnly`) passa a acompanhar as requisições automaticamente,
   porque o Swagger é servido pela **mesma origem** da API. Um script da própria página
   (`/docs/swagger-csrf.js`) lê o cookie CSRF e ecoa o valor em `X-CSRF-Token`.
4. As rotas autenticadas (`/vehicles`, `/users/me`, `scan-crlv`) já funcionam.

O contrato declara os dois esquemas de segurança (`cookieAuth` + `csrfToken`, no header
`X-CSRF-Token`) e `servers[]`, então também dá para importar em Postman/Insomnia — nesse caso use cookie jar
(veja [Autenticação fora do navegador](#autenticação-fora-do-navegador)).

Exemplo de escrita autenticada com `curl` (bash/zsh), mantendo cookies entre chamadas:

```bash
API=http://localhost:3001
ORIGIN=http://localhost:3001
JAR=/tmp/drivo-cookies.txt

curl -i -c "$JAR" -b "$JAR" -H "Origin: $ORIGIN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Avaliador","email":"avaliador@example.com","password":"senha-segura-123"}' \
  "$API/auth/register"

CSRF=$(awk '$6 == "drivo_csrf" { print $7 }' "$JAR")
curl -i -c "$JAR" -b "$JAR" -H "Origin: $ORIGIN" \
  -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d '{"placa":"ABC1D23","marca":"Honda","modelo":"Civic","ano":2022,"chassi":"9BWZZZ377VT004251"}' \
  "$API/vehicles"
```

Para autenticar com uma conta existente, troque a primeira chamada por `/auth/login` e
envie e-mail/senha. No Swagger UI o script `/docs/swagger-csrf.js` copia o cookie CSRF para
o header automaticamente.

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
| `CORS_ORIGINS` | sim | `http://localhost:3000` | Origens explícitas; em desenvolvimento a origem da API também é permitida |
| `COOKIE_SECURE` | não | derivado de `NODE_ENV` | Força/desliga `Secure`; ausente = `true` em `production`. O Compose local usa `false` |
| `GOOGLE_API_KEY` | **não** | vazio | Sem a chave a API **sobe**; o import responde 502 controlado |
| `GEMINI_MODEL` | não | `gemini-2.5-flash` | Modelo usado na extração |
| `GEMINI_TIMEOUT_MS` | não | `30000` | Timeout da chamada externa |
| `UPLOAD_MAX_BYTES` | não | `5242880` | Limite de upload (5 MB) |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | não | `60000` / `300` | Rate limit global (por IP) |
| `AUTH_THROTTLE_LIMIT` | não | `20` | Limite em login/cadastro (por IP/janela) |
| `SCAN_THROTTLE_LIMIT` | não | `10` | Limite em `scan-crlv` |

Todos os limites são configuráveis por env — nenhum número de rate limit está solto no
código. Para endurecer em produção: `AUTH_THROTTLE_LIMIT=5`, `THROTTLE_LIMIT=120`.

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
- Rate limiting próprio (em memória, por IP): **300 req/min** por padrão e **20 req/min** em
  `POST /auth/register` e `POST /auth/login` (configuráveis por env); excedeu →
  `429 RATE_LIMITED` + header `Retry-After`. Coberto por teste que prova o 429 e o header.
- Erros: envelope único, sem stack trace nem detalhes internos (implementado na fase
  foundational):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.", "details": [] } }
```

| Método | Rota | Descrição | Status |
| --- | --- | --- | --- |
| `GET` | `/health` | Healthcheck público (Docker Compose); não toca o banco | ✅ |
| `POST` | `/auth/register` | Cadastro | ✅ |
| `POST` | `/auth/login` | Login (mensagem idêntica para e-mail/senha inválidos) | ✅ |
| `POST` | `/auth/logout` | Logout (limpa cookies) | ✅ |
| `GET` | `/auth/me` | Sessão atual | ✅ |
| `PATCH` | `/users/me` | Alterar o nome do usuário autenticado | ✅ |
| `PATCH` | `/users/me/password` | Alterar senha após confirmar a atual (204; sessão mantida) | ✅ |
| `GET` | `/vehicles` | Listar/pesquisar (`?search=`) | ✅ |
| `POST` | `/vehicles` | Criar veículo | ✅ |
| `GET` | `/vehicles/{id}` | Detalhe | ✅ |
| `PATCH` | `/vehicles/{id}` | Editar | ✅ |
| `DELETE` | `/vehicles/{id}` | Excluir com `X-Confirm-Delete: true` (204; 400 sem confirmação; 404 para veículo alheio) | ✅ |
| `POST` | `/vehicles/scan-crlv` | Upload temporário do CRLV → campos extraídos pelo Gemini (sem persistir veículo) | ✅ |

### Autenticação fora do navegador

O fluxo é cookie + CSRF de propósito: o token de sessão nunca fica acessível ao JavaScript.
Isso exige **cookie jar** e o header `Origin` em qualquer cliente (curl, Postman, Insomnia).

```bash
# 1) Login: guarda drivo_session (HttpOnly) e drivo_csrf no jar
curl -s -c jar.txt -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{"email":"ana@example.com","password":"senha-segura-123"}' \
  http://localhost:3001/auth/login

# 2) O header X-CSRF-Token ecoa exatamente o cookie drivo_csrf
CSRF=$(awk '$6=="drivo_csrf" {print $7}' jar.txt)

# 3) Criação de veículo (POST/PATCH/DELETE exigem o header)
curl -s -b jar.txt -H 'Origin: http://localhost:3000' \
  -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d '{"placa":"ABC1D23","marca":"Chevrolet","modelo":"Onix","ano":2022,"chassi":"9BWZZZ377VT004251"}' \
  http://localhost:3001/vehicles

# 4) Exclusão exige confirmação explícita
curl -i -b jar.txt -X DELETE -H 'Origin: http://localhost:3000' \
  -H "X-CSRF-Token: $CSRF" -H 'X-Confirm-Delete: true' \
  http://localhost:3001/vehicles/<id>
```

Por que não `Authorization: Bearer`? Um único modo de autenticação reduz a superfície
(dois caminhos = duas chances de um deles ficar mais fraco) e permite cookie `__Host-` em
produção. O custo é o cookie jar nos testes manuais — o Swagger UI em `/docs` elimina esse
atrito para quem prefere clicar.

Códigos de erro estáveis: `VALIDATION_ERROR`, `EMAIL_ALREADY_IN_USE`, `PLATE_ALREADY_EXISTS`,
`CONFIRMATION_REQUIRED`, `FILE_REQUIRED`, `UNSUPPORTED_FILE_TYPE`, `FILE_TOO_LARGE`,
`FILE_CONTENT_MISMATCH`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`RATE_LIMITED`, `GEMINI_TIMEOUT`, `GEMINI_UNAVAILABLE`, `GEMINI_QUOTA_EXCEEDED`,
`GEMINI_INVALID_RESPONSE`, `INVALID_CURRENT_PASSWORD`, `INTERNAL_ERROR`.

**Modelo de dados** (migrations `20261021220906_init` + `20261024120000_vehicles_search_simplify` + `20261024170000_figma_vehicle_fields`):
`users` (id, nome, e-mail único, `passwordHash`) e `vehicles` (placa única **por usuário**,
marca, modelo, ano, chassi e opcionais `renavam` 9–11 dígitos, `cor`, `cilindrada`, `tipo`,
`uf`, `anoFabricacao`, `combustivel` e `apelido`). A busca usa `contains`/`mode: 'insensitive'` direto nas colunas —
sem colunas derivadas de busca. **Nenhum arquivo de CRLV é persistido**: o arquivo é recebido
em `os.tmpdir()` e removido após a leitura, inclusive quando há falha.

---

## Como executar os testes

```bash
# API — unitários (Jest)
pnpm test

# API — um arquivo específico
pnpm --filter drivo-api test -- src/app.controller.spec.ts

# API — cobertura
pnpm test:cov

# API — e2e (Supertest; PostgreSQL isolado; Gemini sempre mockado)
# As migrations são aplicadas automaticamente pelo global setup no banco drivo_test.
pnpm test:e2e

# Web — Vitest + Testing Library
pnpm test:web

# Verificação opcional com Gemini real (exige chave e API local ativa)
pnpm verify:gemini

# Qualidade
pnpm lint             # API: oxlint --type-aware · Web: ESLint
pnpm build            # type-check de produção das duas apps

# Segurança
pnpm audit            # dependências
```

Regras da suíte: o Gemini **nunca** é chamado de verdade nos testes. O E2E roda contra um
PostgreSQL real e isolado (`drivo_test`, criado pelo init script do Compose), sem tocar no
banco de desenvolvimento. O fluxo cobre isolamento entre contas, edição, exclusão confirmada,
logout, importação sem persistência e atualização do perfil.
O comando opcional `pnpm verify:gemini` envia somente um PDF sintético ao provedor e consome
a cota da chave configurada em `apps/api/.env`.

### Última validação (2026-10-24)

| Área | Resultado |
| --- | --- |
| API unitária | 58/58 testes em 11 suítes (`pnpm test`) |
| API E2E | 40/40 testes em 5 suítes, PostgreSQL isolado (`pnpm test:e2e`) |
| Web | 17/17 testes em 6 arquivos (`pnpm test:web`) |
| Qualidade | `pnpm lint` aprovado; builds API/Web no Docker aprovados |
| Auditoria | `pnpm audit`: 0 vulnerabilidades |
| Compose limpo | Sem `.env` ou `pnpm setup`: banco/API saudáveis; cadastro 201, login 200, veículo 201 e fallback CRLV 502 amigável sem `GOOGLE_API_KEY` |

O Docker Web usa saída `standalone`, e a imagem foi iniciada isoladamente: `/login` respondeu
200 com os headers de segurança. O `pnpm build` local no Windows ainda pode falhar quando o
Turbopack não inicia o worker CSS de `globals.css`; o build Linux no Docker passou. As demais
verificações de segurança e os limites do teste estão na seção [Segurança](#segurança).

---

## Decisões técnicas

1. **Monorepo pnpm com lockfile único.** Um só `pnpm-lock.yaml` evita divergência de
   dependências entre web e API; cada app mantém seu `package.json` e seu ambiente.
2. **Ambientes por aplicação, com fallback para avaliação.** `apps/api/.env` (segredos/banco)
   e `apps/web/.env.local` (URL pública). A raiz só orquestra. `pnpm setup` gera segredos
   fortes; no Docker, a ausência do `.env` não impede o boot — o entrypoint gera segredos
   aleatórios por execução, então `docker compose up --build` funciona em clone limpo.
3. **Next.js 16 com App Router e PPR.** `cacheComponents` + `partialPrefetching` deixam o
   carregamento de dados explícito (Suspense/cache), evitando fetch dinâmico escondido.
4. **NestJS 12 em ESM.** `"type": "module"` e imports relativos com `.js` (nodenext), o que
   mantém compatibilidade com o Prisma 7.
5. **Prisma 7 com driver adapter (`PrismaPg`).** Sem engine binária no runtime; a URL fica em
   `prisma.config.ts`, e o CLI carrega `apps/api/.env` explicitamente.
6. **Zod como validação única.** O mesmo schema valida env, DTOs e formulários (`.strict()`
   bloqueia mass assignment, inclusive `userId` vindo do cliente).
7. **Sessão em cookie `httpOnly` + CSRF double-submit.** Nada de token em `localStorage`;
   o CSRF tem duas camadas (origem + HMAC ligado ao `jti` da sessão). A própria origem da API
   é aceita, o que mantém o Swagger UI funcional sem abrir mão da checagem de origem.
8. **Argon2id** para senhas (`m=19MiB, t=2, p=1`), com mensagem de erro idêntica para e-mail
   inexistente e senha errada.
9. **Autorização sempre no service, por `userId`.** Recurso de outro usuário responde o mesmo
   `404` de recurso inexistente (não vaza existência).
10. **Gemini só no backend**, com timeout, validação da resposta e mapeamento de falhas para
    502 controlado; o arquivo fica somente no diretório temporário durante a leitura e é removido
    em `finally`. As suítes automatizadas usam sempre um mock.
11. **Docker multi-stage com contexto na raiz.** Necessário para o pnpm workspace (lockfile +
    manifests); `prisma generate` roda antes do `nest build`. A Web usa `output: standalone` e
    inclui somente os arquivos rastreados necessários no runtime.
12. **Portas invertidas em relação ao padrão**: API **3001** e web **3000** (o Next já usa
    3000 por padrão); Postgres no host em **5433** por conflito com um serviço local.

---

## Uso de IA no desenvolvimento

O Codex foi usado como ferramenta de apoio ao longo do desenvolvimento, não só para consultas.
Ajudou a interpretar o enunciado e os frames do Figma, dividir o trabalho em etapas, implementar
e revisar componentes e rotas, preparar testes, investigar erros e organizar a documentação. A
API do Gemini é uma funcionalidade do produto para leitura de CRLV; ela é distinta da IA usada
como apoio ao desenvolvimento.

### Organização do trabalho com Spec Kit

O planejamento foi estruturado com o fluxo do Spec Kit, antes e durante a implementação:

1. **Constituição do projeto:** oito princípios guiaram as decisões — simplicidade,
   legibilidade, separação de responsabilidades, padrões conhecidos, segurança,
   consistência, código verificável e entrega incremental.
2. **Especificação:** requisitos foram organizados em módulos, histórias de usuário,
   prioridades, critérios de aceite e casos de borda.
3. **Plano e contratos:** foram definidos arquitetura e stack, modelo de dados, contrato
   OpenAPI, referências visuais do Figma e passos para executar a aplicação.
4. **Tarefas:** o trabalho foi decomposto em fases com dependências e prioridades: setup,
   fundação, autenticação, garagem e busca, importação de CRLV, edição/exclusão, perfil e
   acabamento transversal. As tarefas incluem validações e testes para os fluxos críticos.
5. **Implementação incremental:** cada fluxo foi construído e conferido antes de avançar,
   mantendo web e API integradas e usando o Figma como referência visual.

O resultado está em um monorepo pnpm com `apps/web`, `apps/api`, scripts compartilhados e
evidências em `docs/`. Os artefatos completos do Spec Kit foram mantidos no workspace de
desenvolvimento, fora deste repositório Git; este README resume como orientaram o trabalho.

As sugestões da IA foram tratadas como alterações a revisar, não como autoridade sobre o
resultado. As decisões de arquitetura e escopo foram conferidas com os requisitos do teste;
os fluxos críticos foram cobertos por testes automatizados, e a integração real do Gemini foi
verificada com um documento sintético. Os resultados e limitações da validação estão descritos
nas seções [Como executar os testes](#como-executar-os-testes), [Segurança](#segurança) e
[Limitações](#limitações). A responsabilidade pelo código entregue e por explicar as decisões
é do candidato.

O enunciado recomenda usar IA somente para consulta. Esta seção descreve o uso que ocorreu no
projeto de forma transparente, incluindo apoio à implementação, revisão e testes.

---

## Fidelidade visual ao Figma

Login, cadastro, garagem, formulários e perfil foram conferidos com os frames fornecidos.
Os cartões usam as cinco fotos ilustrativas do Figma somente nos modelos correspondentes;
outros modelos usam um ícone neutro. O perfil mantém a hierarquia de identidade, informações
pessoais, senha e conta. Combustível e apelido são opcionais e persistidos.

As capturas desktop e móvel estão em [docs/evidence](docs/evidence/README.md), e as decisões
de interface estão em [design-qa.md](apps/web/design-qa.md). O Figma não fornece frames móveis
nem um frame específico para a página separada de upload; por isso, não há uma medida confiável
de fidelidade pixel a pixel. O fluxo de importação foi testado no Edge com um CRLV sintético:
seleção, leitura pelo Gemini, revisão, salvamento e nova importação com o formulário vazio.

---

## Segurança

> **Escopo desta seção:** checklist interno de endurecimento, com itens implementados e
> testados — não é um pentest independente nem certificação. O que não foi feito está
> declarado em [Limitações](#limitações). O projeto foi desenvolvido com assistência de
> agentes de IA; os testes automatizados e a revisão humana são a evidência disponível.

### Controles implementados

| Área | Medida |
| --- | --- |
| Senhas | Argon2id (`m=19 MiB, t=2, p=1`); hash nunca sai do service; resposta idêntica para e-mail inexistente e senha errada |
| Sessão | JWT HS256 em cookie `httpOnly` + `SameSite=Lax`; token nunca no corpo JSON nem em `localStorage` |
| CSRF | Duas camadas: `Origin`/`Referer`/`Sec-Fetch-Site` (falha fechada) + double-submit com HMAC amarrado ao `jti` da sessão. A própria origem da API é aceita (Swagger) |
| Isolamento por usuário | Toda consulta filtra por `userId`; recurso alheio devolve o mesmo `404` de recurso inexistente |
| Validação | Zod `.strict()` em DTOs, query e env — mass assignment (inclusive `userId`) é rejeitado |
| Upload de CRLV | Tipo por extensão + MIME + magic bytes, limite de 5 MB, arquivo apenas em `os.tmpdir()` e removido em `finally` |
| Prompt injection no CRLV | A saída do Gemini passa pelo mesmo schema Zod e **nunca** é salva automaticamente: o usuário revisa e confirma campo a campo |
| Rate limit | Configurável por env: 300 req/min global, 20/min em auth, 10/min em `scan-crlv`; `429` com `Retry-After` |
| Erros | Envelope único, sem stack trace, sem detalhe interno e sem eco do payload |
| Logs | Nenhum fluxo registra placa, Renavam, chassi, e-mail ou senha; falha do Gemini gera um aviso sem o conteúdo do documento. Exceções não tratadas registram nome + stack, nunca o corpo da requisição |
| Headers | API: helmet + CSP restrita (necessária ao Swagger). Web: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Powered-By` desligado |
| Containers | API e web rodam como usuário `node` (não-root); `.dockerignore` mantém `.env` fora da imagem |
| Segredos | Nenhum segredo versionado; `pnpm setup` gera valores aleatórios e o Compose, sem `.env`, gera segredos por execução |

### Verificações executadas

| Verificação | Como | Resultado |
| --- | --- | --- |
| Dependências | `pnpm audit` | **0 vulnerabilidades**. `body-parser` 2.3.0→2.4.0 e `multer` 2.4.0→2.5.0 (DoS no upload) via `overrides` no `pnpm-workspace.yaml` |
| Rate limit | `pnpm --filter drivo-api test` (`auth.rate-limit.spec.ts`) | `429 RATE_LIMITED` + `Retry-After > 0` comprovados |
| Isolamento entre contas | `pnpm test:e2e` + curl em duas contas | `404` com **corpo idêntico** para veículo alheio e UUID inexistente |
| Upload | e2e + curl no Compose | 6 MB → `400 FILE_TOO_LARGE`; `.pdf` com texto → `400 FILE_CONTENT_MISMATCH` (sem chamar o Gemini) |
| Sem chave do Gemini | curl no Compose | `502 GEMINI_UNAVAILABLE` com mensagem para preencher manualmente |
| CSRF | curl no Compose | `Origin` da própria API → 201/200; `Origin` estranha ou ausente → `403` |
| Headers da web | `curl -I http://localhost:3000/login` | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`; **sem** `X-Powered-By` |
| Container não-root | `docker compose exec api id` | `uid=1000(node)` |
| Clone limpo | cópia sem `.env`/`node_modules` → `docker compose up --build -d` | Postgres/API `healthy`, web 200, cadastro 201, login 200 e veículo 201. Portas alternativas no teste porque o stack principal já ocupava 3000/3001/5433 |
| Swagger / OpenAPI | `/docs` e `/docs/swagger-csrf.js` retornam 200; `/docs-json` declara `servers[]`, `cookieAuth` e `csrfToken`; POST autenticado na origem da API retorna 201 | Rotas de escrita exigem cookie + CSRF no mesmo requisito; cadastro/login permanecem públicos |
| Sem chave Gemini | Upload válido de PDF no clone sem `GOOGLE_API_KEY` | `502 GEMINI_UNAVAILABLE`, mensagem orienta preencher manualmente |

Comando para reproduzir a verificação de dependências:

```bash
pnpm audit
```

## Limitações

- **Fora de escopo declarado**: alteração de e-mail, recuperação de senha, verificação por
  e-mail, foto do veículo e exportação do CRLV.
- Sessão com expiração fixa (`JWT_TTL_SECONDS`), **sem refresh token** nem renovação deslizante.
- Listagem de veículos **sem paginação** (volume esperado: garagem pessoal).
- **Busca não ignora acentuação**: `contains` + `mode: 'insensitive'` cobre apenas
  maiúsculas/minúsculas (buscar `onix` não encontra `Ônix`). O contrato atual documenta esse
  comportamento real; a evolução é a extensão `unaccent` do PostgreSQL.
- Rate limiting **ativo, porém em memória** — adequado a uma instância; em múltiplas réplicas
  precisaria de store compartilhado (ex.: Redis).
- Importação limitada a **1 arquivo** por vez, JPEG/PNG/WebP/PDF até **5 MB**; a qualidade da
  extração depende da legibilidade do documento e da cota gratuita do Gemini.
- O prefixo `__Host-` do cookie de CSRF só é usado em produção (exige `Secure`); em
  `http://localhost` o cookie é `drivo_csrf` sem prefixo.
- A fonte **Material Symbols Rounded** é variável e inclui todos os ícones (~5 MB); para
  produção convém subsetar apenas os glifos usados.
- Sem CI/CD configurado; verificações são locais (`pnpm lint`, `pnpm test`, `pnpm build`).
- **CSP completa no frontend**: a web ainda não envia `Content-Security-Policy` (no Next ela
  exige nonce por requisição e pode quebrar hidratação); hoje há `X-Frame-Options`,
  `X-Content-Type-Options` e `Referrer-Policy`.
- **Sem scan de imagem** (Trivy/Grype) e **sem teste de carga/concorrência**; o rate limit é
  em memória e não foi submetido a benchmark.
- **Sem pentest independente**: a seção [Segurança](#segurança) é um checklist interno.
- No Compose sem `apps/api/.env`, os segredos são gerados a cada execução: reiniciar a API
  encerra as sessões abertas (basta novo login).

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
  maiores e `unaccent` para ignorar acentuação (hoje só maiúsculas são ignoradas).
- **Performance de assets**: subsetar a fonte Material Symbols e usar `next/font` com
  `display: swap`; hoje a fonte variável completa (~5 MB) é self-hosted.
- **Deploy** com HTTPS real (cookies `__Host-` completos), backup do volume e migrações em
  pipeline separado.
- **CSP completa no Next** com nonce por requisição, `report-only` primeiro e coleta de
  violações; hoje a proteção de headers é parcial.
- **Scan de imagem** (Trivy) no pipeline e um teste de carga (k6) para validar o rate limit
  sob concorrência.

---

## Problemas comuns

| Sintoma | Causa / solução |
| --- | --- |
| `port is already allocated` na 5433 | Outro Postgres local. Pare-o ou ajuste o mapeamento no `docker-compose.yml`. |
| `DATABASE_URL` ausente ao rodar `pnpm db:*` | Rode `pnpm setup` (cria `apps/api/.env`). |
| API sobe mas login falha com 500 | Falta `JWT_SECRET`/`CSRF_SECRET` válidos (≥ 32 chars) em `apps/api/.env`. |
| Importação responde 502 | `GOOGLE_API_KEY` ausente/inválida ou cota gratuita esgotada — é o comportamento esperado e controlado; o front oferece preenchimento manual. |
| `403` em POST/PATCH/DELETE fora do Swagger | Falta o header `Origin` (ou `X-CSRF-Token` em rota autenticada). Veja [Autenticação fora do navegador](#autenticação-fora-do-navegador). |
| `429 RATE_LIMITED` ao cadastrar/logar várias vezes | Limite por IP (`AUTH_THROTTLE_LIMIT`, padrão 20/min). Aguarde o `Retry-After` ou eleve a env. |
| Cookies não aparecem em cliente HTTP no Compose | O Compose define `COOKIE_SECURE=false` para `http://localhost`; ainda assim use cookie jar (`curl -c/-b`). Com HTTPS real, use `COOKIE_SECURE=true` e o CSRF vira `__Host-drivo_csrf`. |
| Web não enxerga a API | `NEXT_PUBLIC_API_URL` é embutida no **build**; após mudar, rode `docker compose up --build` (ou reinicie o `next dev`). |
| Quero zerar o banco | `docker compose down -v` (apaga o volume `drivo_pgdata`) e suba de novo. |
| `drivo_test` não existe no e2e | Crie apenas o banco de teste: `docker compose exec -T postgres psql -U drivo -d postgres -c "CREATE DATABASE drivo_test;"`. As migrations são aplicadas automaticamente pelo setup E2E. |
| Docker daemon não responde | Abra o Docker Desktop e aguarde o engine iniciar. |

---

## Referências

- Protótipo (Figma): https://www.figma.com/design/kMDaB78808CbApQRhg8kVF/Teste-Full-Stack-Junior-1
- Documentação da API: Swagger em `http://localhost:3001/docs` (quando a API estiver rodando).

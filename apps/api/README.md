# API do DRIVO

API REST em NestJS 12, Prisma 7 e PostgreSQL 16. Ela gerencia autenticação, perfil e veículos,
e usa o Gemini para extrair dados de um CRLV antes de o usuário confirmar o cadastro.

Este app faz parte do [monorepo DRIVO](../../README.md). Execute os comandos abaixo **na raiz**
do repositório, onde ficam `pnpm-lock.yaml` e `docker-compose.yml`.

## Executar

Para subir a aplicação completa com Docker:

```bash
docker compose up --build
```

A API fica em `http://localhost:3001`, o Swagger em `http://localhost:3001/docs` e o
healthcheck em `http://localhost:3001/health`. O Compose aplica as migrations ao iniciar a
API. Ele funciona sem arquivo `.env`; nesse caso, gera segredos temporários a cada execução.

Para desenvolver a API localmente:

```bash
pnpm install
pnpm setup
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm dev:api
```

O PostgreSQL é publicado na porta **5433** do host. O arquivo `apps/api/.env`, criado por
`pnpm setup`, aponta para essa porta; dentro do Compose, a API usa `postgres:5432`.

## Configuração

O modelo de configuração está em [.env.example](.env.example). Os valores mais relevantes são:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão com o PostgreSQL. |
| `JWT_SECRET` e `CSRF_SECRET` | Segredos distintos, com pelo menos 32 caracteres. |
| `CORS_ORIGINS` | Origens autorizadas para requisições com cookies. |
| `GOOGLE_API_KEY` | Habilita a leitura automática do CRLV; fica somente na API. |
| `GEMINI_MODEL` e `GEMINI_TIMEOUT_MS` | Modelo e tempo máximo da leitura. |
| `UPLOAD_MAX_BYTES` | Limite adicional de validação; o upload HTTP tem teto de 5 MB. |
| `THROTTLE_LIMIT`, `AUTH_THROTTLE_LIMIT`, `SCAN_THROTTLE_LIMIT` | Limites de requisições por IP. |

Sem `GOOGLE_API_KEY`, cadastro, login e garagem continuam funcionando. A rota de leitura
retorna um erro controlado, e a web oferece preenchimento manual. Não versione `apps/api/.env`.

## Rotas

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/health` | Estado básico da API. |
| `POST` | `/auth/register` | Cadastro e início da sessão. |
| `POST` | `/auth/login` | Login. |
| `POST` | `/auth/logout` | Encerramento da sessão. |
| `GET` | `/auth/me` | Usuário autenticado. |
| `PATCH` | `/users/me` | Alteração do nome. |
| `PATCH` | `/users/me/password` | Alteração da senha com confirmação da senha atual. |
| `GET` / `POST` | `/vehicles` | Listagem, busca (`?search=`) e criação. |
| `GET` / `PATCH` / `DELETE` | `/vehicles/:id` | Consulta, edição e exclusão de um veículo. |
| `POST` | `/vehicles/scan-crlv` | Leitura de um arquivo, sem criar o veículo. |

As respostas são JSON. O contrato OpenAPI está disponível em `/docs` e `/docs-json`.
No Swagger, faça login ou cadastro pelo **Try it out** antes de chamar rotas protegidas.
O script da página envia automaticamente o cookie de sessão e o header CSRF. Para usar
`curl` ou Postman, veja o [exemplo com cookie jar no README principal](../../README.md#autenticação-fora-do-navegador).

A sessão usa JWT em cookie `httpOnly`. Requisições de escrita autenticadas exigem `Origin`
permitida e `X-CSRF-Token`; a exclusão também exige `X-Confirm-Delete: true`. Consultas de
veículos sempre filtram pelo usuário da sessão.

## Leitura do CRLV

Envie um PDF, JPG, PNG ou WebP de até **5 MB** como campo `file` em
`POST /vehicles/scan-crlv`. A API confere o tipo e o conteúdo, passa o arquivo temporário ao
Gemini e valida os campos extraídos. A resposta devolve dados e campos obrigatórios ausentes
para revisão. **A leitura não persiste veículo**: a criação ou edição acontece somente após
uma requisição explícita do usuário. O arquivo temporário é removido também em caso de erro.

## Organização do código

| Caminho | Responsabilidade |
| --- | --- |
| `src/modules/auth` | Cadastro, login, sessão e logout. |
| `src/modules/users` | Dados do perfil e senha. |
| `src/modules/vehicles` | CRUD e isolamento por usuário. |
| `src/modules/crlv` | Upload, validação e integração com o Gemini. |
| `src/common` | Guards, cookies, filtro de erros e decorators. |
| `src/config` | Leitura e validação das variáveis de ambiente com Zod. |
| `prisma` | Schema e migrations versionadas. |
| `test` | Testes E2E com PostgreSQL isolado e Gemini simulado. |

## Verificar

```bash
pnpm test                     # testes unitários da API
pnpm test:e2e                 # exige o PostgreSQL do Compose
pnpm test:cov                 # cobertura da API
pnpm --filter drivo-api lint
pnpm --filter drivo-api build
```

O E2E usa o banco `drivo_test`, separado do banco de desenvolvimento, e não consome a API
externa do Gemini. Para uma verificação **opcional** com a chave real e um PDF sintético,
inicie a API e execute `pnpm verify:gemini`; essa chamada consome a cota do provedor.

As decisões de segurança, limitações conhecidas e instruções completas de entrega estão no
[README principal](../../README.md).

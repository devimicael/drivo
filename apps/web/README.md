# Frontend do DRIVO

Aplicação Next.js 16 (App Router), React 19 e Tailwind CSS v4 para a garagem pessoal.
Consome a [API do DRIVO](../api/README.md) para autenticação, veículos, perfil e leitura
assistida de CRLV. O [README principal](../../README.md) reúne a entrega completa.

Execute os comandos abaixo **na raiz** do monorepo.

## Executar

Para subir web, API e PostgreSQL em um comando:

```bash
docker compose up --build
```

Abra `http://localhost:3000`. Para desenvolver a web localmente, com a API já em execução:

```bash
pnpm install
pnpm setup
pnpm dev:web
```

`pnpm setup` cria `apps/web/.env.local` a partir de [.env.example](.env.example). A variável
`NEXT_PUBLIC_API_URL` indica a URL que **o navegador** usa para acessar a API; o valor local
é `http://localhost:3001`. Como ela entra no bundle durante o build, reinicie o servidor de
desenvolvimento ou reconstrua a imagem após alterá-la. Não versione `.env.local`.

## Páginas

| Rota | Função |
| --- | --- |
| `/login` | Entrar na conta. |
| `/cadastro` | Criar conta. |
| `/garagem` | Listar e pesquisar os veículos; inclui estado vazio. |
| `/garagem/novo` | Cadastrar veículo manualmente. |
| `/garagem/importar` | Selecionar CRLV, acompanhar a leitura e revisar os dados. |
| `/garagem/[id]/editar` | Editar, importar novo CRLV ou excluir com confirmação. |
| `/perfil` | Alterar nome, senha ou sair da conta. |

Na importação, o usuário escolhe um PDF ou imagem, vê o estado de leitura e revisa os campos
antes de salvar. Um novo fluxo de importação começa sem o arquivo ou os dados da leitura
anterior. Há mensagens próprias para carregamento, erro, lista vazia e sessão expirada.

## Organização do código

| Caminho | Responsabilidade |
| --- | --- |
| `src/app` | Rotas e layouts públicos/protegidos. |
| `src/features` | Interfaces e formulários de auth, garagem, importação e perfil. |
| `src/components` | Componentes visuais compartilhados, como botão, input e cabeçalho. |
| `src/hooks` e `src/services` | Consultas/mutações com TanStack Query e chamadas da API. |
| `src/schemas` | Validação dos formulários com Zod. |
| `src/lib/api.ts` | Cliente HTTP único, cookies, CSRF e tratamento de erro. |
| `src/proxy.ts` | Redirecionamento por presença do cookie; a API valida a sessão de fato. |
| `src/app/globals.css` | Tokens visuais, estilos globais e movimentos sutis. |

O cliente HTTP envia cookies com `credentials: "include"` e ecoa o token CSRF nas requisições
de escrita. A autenticação e a autorização reais ficam na API.

## Interface e responsividade

O Figma do desafio orientou login, cadastro, garagem, formulários e perfil. A interface usa
Inter, JetBrains Mono, Material Symbols Rounded, tema escuro e azul primário. Os tokens de
cor e espaçamento ficam em `src/app/globals.css`; componentes compartilhados concentram os
estados de foco, desabilitado e carregamento.

O Figma fornecido mostra referências desktop. A versão móvel adapta grade, cabeçalho,
formulários e ações para telas estreitas; ela foi conferida em viewport de 390 × 844 px.
As decisões e limites da comparação estão em [design-qa.md](design-qa.md), com capturas em
[docs/evidence](../../docs/evidence/README.md). Não há uma medida certificada de fidelidade
pixel a pixel para todos os estados.

## Verificar

```bash
pnpm test:web                 # Vitest + Testing Library
pnpm --filter drivo-web lint
pnpm --filter drivo-web build
```

Os testes cobrem formulários, validação de veículos e arquivos, perfil e redirecionamento de
sessão. O fluxo completo de CRLV também foi exercitado manualmente no Edge com documento
sintético e Gemini real. O build de produção foi conferido nas imagens Docker; no Windows,
o worker CSS do Turbopack pode impedir o build local.

Para requisitos, decisões técnicas e limitações de toda a aplicação, consulte o
[README principal](../../README.md).


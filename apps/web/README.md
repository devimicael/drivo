# drivo-web

Frontend do DRIVO (Next.js 16 + React 19 + Tailwind CSS v4).

Instalação, execução, variáveis de ambiente, decisões técnicas e limitações estão no
[README da raiz](../../README.md).

Comandos rápidos (a partir da raiz do monorepo):

```bash
pnpm dev:web        # watch em http://localhost:3000
pnpm test:web       # Vitest
pnpm build          # build de produção
```

## Design

O design de referência é o protótipo do Figma do desafio. As telas de autenticação
(`/login`, `/cadastro`) usam um **mundo escuro fixo**: fundo quase preto, **azul primário**
(`bg-primary`) para ação e links, campos `bg-field` sem
bordas. Os tokens vivem em `src/app/globals.css` (`@theme inline`: `surface`, `field`,
`muted`, `bright`, `primary`, `danger`); nenhuma cor solta nas classes.

### Responsivo (decisão registrada)

O Figma documenta apenas o desktop. Decisão para telas menores:

- **Abaixo de `lg`:** o hero (coluna da foto, `AuthHero`) fica oculto (`hidden lg:flex`)
  e o formulário ocupa a tela inteira, centralizado, com o link "Criar conta" fixado no
  rodapé da coluna.
- Alternativa avaliada — manter a foto como faixa no topo em tablets — rejeitada: mais
  trabalho para ganho pequeno de fidelidade, pois o texto do hero ficaria curto demais na
  faixa.

### Componentes reutilizáveis

`src/components/ui/`: `Button` (loading/disabled), `Input` (label + erro + a11y), `Logo`,
`AuthHero` (foto + gradiente + copy). Nascidos na tela de login, reaproveitados no cadastro.


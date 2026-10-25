# Drivo — design QA

## Refinamento visual e de interação (2026-10-24)

- Todos os botões ativos usam `cursor-pointer` no componente compartilhado ou na própria classe;
  links, controles de seleção e `summary` também recebem ponteiro via CSS global. Botões
  desabilitados mantêm `cursor: not-allowed`. O cursor computado foi conferido no navegador.
- O diálogo do frame 1:1348 agora usa triângulo de alerta, título com o veículo, texto sobre
  a placa, ações de mesma largura e botão vermelho. A abertura, o cancelamento e os layouts
  desktop/móvel foram conferidos sem excluir dados.
- O frame 1:905 orientou os cartões: raio de 22 px, hero de 216 px, conteúdo de 192 px,
  foto original sem escurecimento extra, combustível na linha de características,
  RENAVAM/chassi em duas colunas e seta para editar.
  A exclusão continua acessível pela página de edição, como no fluxo do protótipo.
- O bloco de CRLV do frame 1:1093 orientou ícone, cores e texto. A rota de importação ganhou
  arrastar e soltar, visualização de arquivo, troca sem perder a seleção ao cancelar o diálogo
  do sistema, estado de leitura, revisão e opção manual. O arquivo lido aparece no painel
  lateral do formulário como no Figma.
- Títulos e espaçamento da garagem e dos formulários foram confrontados com os frames 1:905
  e 1:1093. O perfil foi comparado com o frame 1:1487; login, cadastro e garagem vazia já
  tinham sido revisados na rodada anterior.
- No login, o botão de desktop ganhou 8 px adicionais de respiro em relação ao campo de senha;
  o intervalo móvel permanece no valor anterior, já revisado no viewport móvel.
- O aviso de hidratação observado no Edge coincide com `data-lt-installed="true"` e
  `suppresshydrationwarning="true"` injetados no `<html>` pela extensão LanguageTool. Esses
  atributos não estão no `RootLayout`; no navegador isolado sem a extensão, o DOM não os contém.

**Limite da comparação:** o Figma fornecido não contém um frame específico para a página
separada de upload nem frames móveis. O conector Figma recusou acesso ao arquivo; a comparação
foi feita pelo protótipo/editor no navegador. A fidelidade de 98% não pode ser certificada como
métrica pixel a pixel; a verificação cobre os elementos e estados observáveis nos frames.

## Estado da revisão (2026-10-24)

A fonte visual foi o arquivo Figma `kMDaB78808CbApQRhg8kVF`, inspecionado pelo editor
no navegador. O MCP recusou a sessão por permissão; o painel Properties/Image do editor
permitiu conferir medidas e baixar as cinco fotos originais. A conferência final foi feita
com as rotas locais e os frames correspondentes abertos no navegador. As capturas cobrem o
desktop padrão e o viewport móvel de 390 × 844 px. O Figma não fornece um frame móvel; a
captura móvel documenta o comportamento responsivo implementado, não comparação pixel a pixel.

## Tokens e medidas conferidos

- Inter nos textos; JetBrains Mono em placa, RENAVAM e chassi, via `next/font`.
- Tema somente escuro, fundo #000000 e superfícies #1C1C1E/#2C2C2E; azul #0A84FF.
- Material Symbols Rounded, sem nova biblioteca de ícones.
- Main da garagem: padding superior/inferior 48 px, laterais 80 px, gap 32 px.
- Hero dos cartões: 413,33 × 216 px. Content: 192 px de altura, padding 22/24/24/24 px.
- Tokens de espaçamento, raios e cores em `src/app/globals.css`.
- Fotos originais e sua procedência em `public/img/vehicles/README.md`. Uso com recorte cover
  e altura de 216 px. Fotografias vinculadas somente aos cinco modelos do Figma.

## Correspondência das telas com os frames do Figma

| Tela/estado | Referência e situação |
| --- | --- |
| Login | Frame 1:833, split com hero original, campos de 360 × 44 px. Captura final desktop. |
| Cadastro | Frame 1:864, split e hero original; nomes de campos/validação mantidos. Captura final desktop. |
| Garagem vazia | Frame 1:1576, título e CTAs centrais. Captura final desktop. |
| Garagem preenchida | Frame 1:905, grade de veículos e imagens originais. Captura final desktop e viewport 390 × 844 px. |
| Busca | Nenhum resultado e busca com hífen verificados; captura final sem resultados. Acentuação não é normalizada no contrato atual. |
| Novo veículo | Frame 1:1093, identificação, características, CRLV lateral e barra inferior. Combustível e apelido incluídos com persistência real. Capturas desktop e móvel. |
| Importar CRLV | Tela derivada do mesmo sistema visual; upload → revisão → confirmação. Capturas desktop e móvel; API real e fluxo completo no Edge validados com PDF sintético. |
| Revisão de extração | Campos numéricos aceitos sem edição obrigatória; ausentes destacados até preenchimento; testes de componente aprovados e nenhuma persistência automática na verificação real da API. |
| Editar | Frame 1:1222: modelo no título, histórico, novo CRLV com revisão, exclusão e barra inferior. Capturas finais do formulário e da revisão; rótulo “Atualizar veículo” corrigido. |
| Excluir | Frame 1:1348: confirmação no mesmo tema; diálogo nativo mantém foco e Escape/cancelamento. Backend exige confirmação explícita. Captura final do diálogo. |
| Perfil | Frame 1:1487, identidade/data, informações pessoais, senha e conta. Capturas finais desktop e viewport 390 × 844 px. |
| Carregamento/erro | Spinner explícito, tentativa novamente em falha de conexão, erros junto aos campos e estados de envio. |
| Sessão expirada | Corrigido ciclo de redirecionamento com cookie antigo; teste de navegação aprovado. |

## Fluxos e decisões

- Nome/sobrenome são combinados no `name` já existente; e-mail continua somente leitura.
- Alteração de senha verifica a atual, usa Argon2id e mantém a sessão, conforme texto do Figma.
- Combustível e apelido são opcionais. O combustível pode vir do documento; apelido é escolhido
  pelo usuário. Cilindrada e UF ficam em “Outros dados opcionais”.
- Campos opcionais vazios agora permitem cadastro manual; números extraídos pelo Gemini são
  aceitos diretamente e permanecem editáveis. Testes de regressão aprovados.
- Atualizar com novo CRLV usa PATCH somente após confirmação; cancelar não persiste alterações.
- Logout só redireciona após sucesso; falha de rede mantém mensagem utilizável e opção de repetir.
- As fotos são ilustrações dos modelos do protótipo, não uploads da pessoa. Outros modelos usam
  um ícone neutro. Envio de fotos e exclusão de conta permanecem fora do escopo.

## Evidências

- `docs/evidence/gemini-verification.json`: Gemini real + CRUD/perfil/logout pela API aprovados.
- `docs/evidence/final-*.png`: capturas da rodada anterior de login, cadastro, garagem,
  perfil, veículo, exclusão e importação; incluem viewports móveis. Os componentes refinados
  acima foram verificados novamente no navegador sem persistir dados pessoais da conta local.
- `docs/evidence/*.png`: capturas intermediárias e busca sem resultados.
- API 58 unitários / 40 E2E; web 17 testes; lint e TypeScript aprovados; builds Docker aprovados.
- A chave Gemini não foi copiada ao frontend, às evidências ou ao Git.
- No Edge, o PDF sintético foi selecionado, lido pelo Gemini e apresentado para revisão.
  Após salvar, o veículo apareceu na garagem e uma segunda importação abriu vazia.
  A conta e o veículo temporários foram removidos ao fim da verificação.

# Evidências de revisão — 2026-10-24

## Verificação funcional

- API: 58 testes unitários e 40 E2E aprovados em PostgreSQL real isolado.
- Web: 17 testes aprovados, incluindo revisão de CRLV, números opcionais e sessão expirada.
- Lint API/Web e TypeScript Web aprovados.
- Builds de produção API/Web aprovados no Docker.
- Gemini real: resultado em [gemini-verification.json](./gemini-verification.json).

O comando opt-in `pnpm verify:gemini` exige a API de desenvolvimento em execução e a chave
configurada somente em `apps/api/.env`. Ele consome a cota do provedor e envia exclusivamente
o PDF sintético `apps/api/test/fixtures/crlv-sintetico.pdf`; verifica extração, ausência de
persistência automática, confirmação, CRUD, busca, perfil e logout. Remove a conta criada
ao final. As suítes normais usam mock e nunca consomem a API externa.

## Capturas finais

Capturadas no navegador na primeira revisão final e conferidas com os frames correspondentes do Figma.
O refinamento posterior de cartões, exclusão e CRLV está descrito em `apps/web/design-qa.md`;
essas imagens mostram a versão anterior desses componentes.
Os arquivos móveis usam viewport 390 × 844 px; o arquivo Figma fornecido contém somente referências
desktop, então essas capturas verificam adaptação responsiva.

- [Login desktop](./final-login-desktop.png) e [cadastro desktop](./final-signup-desktop.png)
- [Garagem vazia desktop](./final-garage-empty-desktop.png)
- [Garagem preenchida desktop](./final-garage-populated-desktop.png) e [móvel](./final-garage-populated-mobile-390.png)
- [Busca sem resultados](./busca-vazia-desktop.png)
- [Novo veículo desktop](./final-new-vehicle-desktop.png) e [móvel](./final-new-vehicle-mobile-390.png)
- [Importar CRLV desktop](./final-import-edit-desktop.png), [revisão de edição](./final-import-edit-review-desktop.png) e [móvel](./final-import-mobile-390.png)
- [Edição desktop](./final-edit-vehicle-desktop.png) e [confirmação de exclusão](./final-delete-dialog-desktop.png)
- [Perfil desktop](./final-profile-desktop.png) e [móvel](./final-profile-mobile-390.png)
- [Atualizar veículo desktop](./final-import-edit-desktop.png)

O fluxo completo também foi conferido no Edge com `01-corolla-cross.pdf`: seleção local,
estado de leitura, extração real pelo Gemini, revisão, salvamento na garagem e nova importação
com o formulário vazio. A conta e o veículo temporários foram removidos ao fim do teste.
O teste direto da API está registrado em `gemini-verification.json`.

-- Busca passa a usar contains/mode insensitive: as colunas derivadas e os
-- índices extras deixam de existir. @@unique([userId, placa]) é mantido.
DROP INDEX "vehicles_userId_idx";
DROP INDEX "vehicles_userId_modelo_idx";
DROP INDEX "vehicles_userId_marca_idx";
DROP INDEX "vehicles_userId_ano_idx";

ALTER TABLE "vehicles"
  DROP COLUMN "modeloBusca",
  DROP COLUMN "marcaBusca",
  DROP COLUMN "origem";

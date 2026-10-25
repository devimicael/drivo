-- Campos opcionais exibidos nos formulários do Figma. Preserva registros existentes.
ALTER TABLE "vehicles" ADD COLUMN "combustivel" VARCHAR(40), ADD COLUMN "apelido" VARCHAR(80);

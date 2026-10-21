-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "placa" VARCHAR(10) NOT NULL,
    "marca" VARCHAR(60) NOT NULL,
    "modelo" VARCHAR(80) NOT NULL,
    "ano" INTEGER NOT NULL,
    "chassi" VARCHAR(17) NOT NULL,
    "renavam" VARCHAR(20),
    "cor" VARCHAR(40),
    "cilindrada" INTEGER,
    "tipo" VARCHAR(40),
    "uf" CHAR(2),
    "anoFabricacao" INTEGER,
    "origem" VARCHAR(10) NOT NULL DEFAULT 'MANUAL',
    "modeloBusca" VARCHAR(80) NOT NULL,
    "marcaBusca" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");

-- CreateIndex
CREATE INDEX "vehicles_userId_modelo_idx" ON "vehicles"("userId", "modeloBusca");

-- CreateIndex
CREATE INDEX "vehicles_userId_marca_idx" ON "vehicles"("userId", "marcaBusca");

-- CreateIndex
CREATE INDEX "vehicles_userId_ano_idx" ON "vehicles"("userId", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_userId_placa_key" ON "vehicles"("userId", "placa");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

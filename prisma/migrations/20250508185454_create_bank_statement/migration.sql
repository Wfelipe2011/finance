-- CreateEnum
CREATE TYPE "Type" AS ENUM ('RECEBIMENTO', 'PAGAMENTO');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('CONTA_CORRENTE', 'CARTAO_CREDITO');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ALIMENTACAO', 'SAUDE', 'TRANSPORTE', 'LAZER', 'EDUCACAO', 'HABITACAO', 'SERVICOS', 'OUTROS', 'DONATIVOS', 'PETS', 'INVESTIMENTOS');

-- CreateTable
CREATE TABLE "bank_statement" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "historico" TEXT NOT NULL,
    "credito" DOUBLE PRECISION NOT NULL,
    "debito" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'OUTROS',
    "type" "Type" NOT NULL,
    "mode" "Mode" NOT NULL,

    CONSTRAINT "bank_statement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_hash_key" ON "bank_statement"("hash");

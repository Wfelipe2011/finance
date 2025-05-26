-- CreateEnum
CREATE TYPE "TipoStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO');

-- CreateEnum
CREATE TYPE "TipoArquivo" AS ENUM ('EXTRATO_BANCARIO', 'FATURA_CARTAO_CREDITO');

-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "data_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoArquivo" NOT NULL,
    "status" "TipoStatus" NOT NULL DEFAULT 'PENDENTE',
    "tenant_id" INTEGER NOT NULL,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

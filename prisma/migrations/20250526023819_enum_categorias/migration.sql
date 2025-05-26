/*
  Warnings:

  - You are about to drop the `categorias` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoria` to the `palavras_chave_categoria` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('ALIMENTACAO', 'SAUDE', 'TRANSPORTE', 'LAZER', 'EDUCACAO', 'SERVICOS', 'OUTROS', 'PETS', 'SALARIO', 'INVESTIMENTOS', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'FERIAS', 'IMPOSTOS', 'CONTAS', 'UTILIDADES', 'VIAGEM', 'DOACOES', 'DESPESAS_FIXAS', 'DESPESAS_VARIAVEIS', 'OUTRAS_RECEITAS');

-- DropForeignKey
ALTER TABLE "categorias" DROP CONSTRAINT "categorias_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "palavras_chave_categoria" DROP CONSTRAINT "palavras_chave_categoria_categoria_id_fkey";

-- DropForeignKey
ALTER TABLE "transacoes" DROP CONSTRAINT "transacoes_categoria_id_fkey";

-- DropForeignKey
ALTER TABLE "transacoes_cartao_credito" DROP CONSTRAINT "transacoes_cartao_credito_categoria_id_fkey";

-- AlterTable
ALTER TABLE "palavras_chave_categoria" ADD COLUMN     "categoria" "TipoCategoria" NOT NULL;

-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "categoria" "TipoCategoria" DEFAULT 'OUTROS';

-- AlterTable
ALTER TABLE "transacoes_cartao_credito" ADD COLUMN     "categoria" "TipoCategoria" NOT NULL DEFAULT 'OUTROS';

-- DropTable
DROP TABLE "categorias";

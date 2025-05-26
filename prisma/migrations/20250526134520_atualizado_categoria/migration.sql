/*
  Warnings:

  - The values [OUTRAS_RECEITAS] on the enum `TipoCategoria` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoCategoria_new" AS ENUM ('ALIMENTACAO', 'SAUDE', 'TRANSPORTE', 'LAZER', 'EDUCACAO', 'SERVICOS', 'OUTROS', 'PETS', 'SALARIO', 'INVESTIMENTOS', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'FERIAS', 'IMPOSTOS', 'CONTAS', 'UTILIDADES', 'VIAGEM', 'DOACOES', 'DESPESAS_FIXAS', 'DESPESAS_VARIAVEIS', 'RECEITAS');
ALTER TABLE "transacoes" ALTER COLUMN "categoria" DROP DEFAULT;
ALTER TABLE "transacoes_cartao_credito" ALTER COLUMN "categoria" DROP DEFAULT;
ALTER TABLE "transacoes" ALTER COLUMN "categoria" TYPE "TipoCategoria_new" USING ("categoria"::text::"TipoCategoria_new");
ALTER TABLE "transacoes_cartao_credito" ALTER COLUMN "categoria" TYPE "TipoCategoria_new" USING ("categoria"::text::"TipoCategoria_new");
ALTER TABLE "palavras_chave_categoria" ALTER COLUMN "categoria" TYPE "TipoCategoria_new" USING ("categoria"::text::"TipoCategoria_new");
ALTER TYPE "TipoCategoria" RENAME TO "TipoCategoria_old";
ALTER TYPE "TipoCategoria_new" RENAME TO "TipoCategoria";
DROP TYPE "TipoCategoria_old";
ALTER TABLE "transacoes" ALTER COLUMN "categoria" SET DEFAULT 'OUTROS';
ALTER TABLE "transacoes_cartao_credito" ALTER COLUMN "categoria" SET DEFAULT 'OUTROS';
COMMIT;

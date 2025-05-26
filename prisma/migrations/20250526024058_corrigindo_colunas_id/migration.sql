/*
  Warnings:

  - You are about to drop the column `categoria_id` on the `palavras_chave_categoria` table. All the data in the column will be lost.
  - The primary key for the `transacoes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoria_id` on the `transacoes` table. All the data in the column will be lost.
  - The primary key for the `transacoes_cartao_credito` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoria_id` on the `transacoes_cartao_credito` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "palavras_chave_categoria" DROP COLUMN "categoria_id";

-- AlterTable
ALTER TABLE "transacoes" DROP CONSTRAINT "transacoes_pkey",
DROP COLUMN "categoria_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "transacoes_id_seq";

-- AlterTable
ALTER TABLE "transacoes_cartao_credito" DROP CONSTRAINT "transacoes_cartao_credito_pkey",
DROP COLUMN "categoria_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "transacoes_cartao_credito_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "transacoes_cartao_credito_id_seq";

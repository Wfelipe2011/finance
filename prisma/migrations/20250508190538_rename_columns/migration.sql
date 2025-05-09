/*
  Warnings:

  - You are about to drop the `bank_statement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "bank_statement";

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "history" TEXT NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'OUTROS',
    "type" "Type" NOT NULL,
    "mode" "Mode" NOT NULL,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankStatement_hash_key" ON "BankStatement"("hash");

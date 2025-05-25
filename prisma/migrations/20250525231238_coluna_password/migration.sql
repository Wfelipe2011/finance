/*
  Warnings:

  - You are about to drop the `_TenantUsuarios` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `password` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_TenantUsuarios" DROP CONSTRAINT "_TenantUsuarios_A_fkey";

-- DropForeignKey
ALTER TABLE "_TenantUsuarios" DROP CONSTRAINT "_TenantUsuarios_B_fkey";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "_TenantUsuarios";

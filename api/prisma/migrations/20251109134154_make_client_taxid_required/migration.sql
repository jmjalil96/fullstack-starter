/*
  Warnings:

  - Made the column `taxId` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Client_taxId_idx";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "taxId" SET NOT NULL;

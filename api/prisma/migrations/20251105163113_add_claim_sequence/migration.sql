/*
  Warnings:

  - A unique constraint covering the columns `[claimSequence]` on the table `Claim` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "claimSequence" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimSequence_key" ON "Claim"("claimSequence");

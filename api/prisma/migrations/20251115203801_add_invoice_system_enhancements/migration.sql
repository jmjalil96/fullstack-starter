/*
  Warnings:

  - The values [PAID,DISPUTED] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `paidDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `policyId` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `insurerInvoiceNumber` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_PAYMENT', 'PAID');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('PENDING', 'VALIDATED', 'DISCREPANCY', 'CANCELLED');
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_policyId_fkey";

-- DropIndex
DROP INDEX "public"."Invoice_policyId_idx";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "paidDate",
DROP COLUMN "policyId",
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "insurerInvoiceNumber" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
ADD COLUMN     "uploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PolicyAffiliate" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "removedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvoicePolicy" (
    "invoiceId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "expectedBreakdown" JSONB NOT NULL,
    "expectedAffiliateCount" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePolicy_pkey" PRIMARY KEY ("invoiceId","policyId")
);

-- CreateIndex
CREATE INDEX "InvoicePolicy_invoiceId_idx" ON "InvoicePolicy"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePolicy_policyId_idx" ON "InvoicePolicy"("policyId");

-- CreateIndex
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

-- CreateIndex
CREATE INDEX "PolicyAffiliate_isActive_idx" ON "PolicyAffiliate"("isActive");

-- AddForeignKey
ALTER TABLE "InvoicePolicy" ADD CONSTRAINT "InvoicePolicy_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePolicy" ADD CONSTRAINT "InvoicePolicy_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `insurerInvoiceNumber` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Invoice_invoiceNumber_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "insurerInvoiceNumber";

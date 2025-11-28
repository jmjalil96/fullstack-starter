/*
  Warnings:

  - You are about to drop the column `fileName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the `ClaimAttachment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fileId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileId` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileEntityType" AS ENUM ('CLAIM', 'INVOICE', 'TICKET', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ClaimFileCategory" AS ENUM ('RECEIPT', 'PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'AUTHORIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceFileCategory" AS ENUM ('INVOICE_PDF', 'BREAKDOWN', 'RECEIPT', 'SUPPORTING_DOC', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."ClaimAttachment" DROP CONSTRAINT "ClaimAttachment_claimId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClaimAttachment" DROP CONSTRAINT "ClaimAttachment_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_uploadedById_fkey";

-- DropIndex
DROP INDEX "public"."Document_uploadedById_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "fileUrl",
DROP COLUMN "mimeType",
DROP COLUMN "uploadedById",
ADD COLUMN     "fileId" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "fileUrl",
DROP COLUMN "mimeType",
DROP COLUMN "uploadedAt",
DROP COLUMN "uploadedById";

-- DropTable
DROP TABLE "public"."ClaimAttachment";

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL DEFAULT 'default',
    "originalName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksum" TEXT,
    "entityType" "FileEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "clientId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "category" "ClaimFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "category" "InvoiceFileCategory",
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "File_entityType_entityId_idx" ON "File"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "File_entityType_clientId_idx" ON "File"("entityType", "clientId");

-- CreateIndex
CREATE INDEX "File_clientId_entityType_idx" ON "File"("clientId", "entityType");

-- CreateIndex
CREATE INDEX "File_clientId_uploadedAt_idx" ON "File"("clientId", "uploadedAt");

-- CreateIndex
CREATE INDEX "File_storageKey_idx" ON "File"("storageKey");

-- CreateIndex
CREATE INDEX "File_uploadedById_idx" ON "File"("uploadedById");

-- CreateIndex
CREATE INDEX "File_uploadedAt_idx" ON "File"("uploadedAt");

-- CreateIndex
CREATE INDEX "File_mimeType_idx" ON "File"("mimeType");

-- CreateIndex
CREATE INDEX "File_deletedAt_idx" ON "File"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimFile_fileId_key" ON "ClaimFile"("fileId");

-- CreateIndex
CREATE INDEX "ClaimFile_claimId_idx" ON "ClaimFile"("claimId");

-- CreateIndex
CREATE INDEX "ClaimFile_category_idx" ON "ClaimFile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceFile_fileId_key" ON "InvoiceFile"("fileId");

-- CreateIndex
CREATE INDEX "InvoiceFile_invoiceId_idx" ON "InvoiceFile"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceFile_category_idx" ON "InvoiceFile"("category");

-- CreateIndex
CREATE UNIQUE INDEX "TicketFile_fileId_key" ON "TicketFile"("fileId");

-- CreateIndex
CREATE INDEX "TicketFile_messageId_idx" ON "TicketFile"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_fileId_key" ON "Document"("fileId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimFile" ADD CONSTRAINT "ClaimFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimFile" ADD CONSTRAINT "ClaimFile_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceFile" ADD CONSTRAINT "InvoiceFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceFile" ADD CONSTRAINT "InvoiceFile_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFile" ADD CONSTRAINT "TicketFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFile" ADD CONSTRAINT "TicketFile_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

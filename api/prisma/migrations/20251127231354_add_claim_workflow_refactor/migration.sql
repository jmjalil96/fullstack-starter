-- Migration: add_claim_workflow_refactor
-- This migration transforms the Claim model from 4-status to 7-status workflow

-- CreateEnum (CareType is new)
CREATE TYPE "CareType" AS ENUM ('AMBULATORY', 'HOSPITALIZATION', 'MATERNITY', 'EMERGENCY', 'OTHER');

-- Step 1: Add new columns to Claim BEFORE changing the enum
ALTER TABLE "Claim"
ADD COLUMN IF NOT EXISTS "amountApproved" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "amountDenied" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "amountSubmitted" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "amountUnprocessed" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "businessDays" INTEGER,
ADD COLUMN IF NOT EXISTS "careType" "CareType",
ADD COLUMN IF NOT EXISTS "copayApplied" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "deductibleApplied" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "diagnosisCode" TEXT,
ADD COLUMN IF NOT EXISTS "diagnosisDescription" TEXT,
ADD COLUMN IF NOT EXISTS "settlementDate" DATE,
ADD COLUMN IF NOT EXISTS "settlementNotes" TEXT,
ADD COLUMN IF NOT EXISTS "settlementNumber" TEXT,
ADD COLUMN IF NOT EXISTS "updatedById" TEXT;

-- Step 2: Migrate data from old columns to new columns
UPDATE "Claim" SET
  "amountSubmitted" = "amount",
  "amountApproved" = "approvedAmount",
  "settlementDate" = "resolvedDate";

-- Step 3: Create new enum type with all new values
CREATE TYPE "ClaimStatus_new" AS ENUM ('DRAFT', 'PENDING_INFO', 'VALIDATION', 'SUBMITTED', 'RETURNED', 'SETTLED', 'CANCELLED');

-- Step 4: Add temporary column with new enum type
ALTER TABLE "Claim" ADD COLUMN "status_new" "ClaimStatus_new";

-- Step 5: Transform old status values to new ones
-- SUBMITTED stays SUBMITTED
-- UNDER_REVIEW -> VALIDATION
-- APPROVED -> SETTLED
-- REJECTED -> CANCELLED
UPDATE "Claim" SET "status_new" =
  CASE
    WHEN "status"::text = 'SUBMITTED' THEN 'SUBMITTED'::"ClaimStatus_new"
    WHEN "status"::text = 'UNDER_REVIEW' THEN 'VALIDATION'::"ClaimStatus_new"
    WHEN "status"::text = 'APPROVED' THEN 'SETTLED'::"ClaimStatus_new"
    WHEN "status"::text = 'REJECTED' THEN 'CANCELLED'::"ClaimStatus_new"
    ELSE 'DRAFT'::"ClaimStatus_new"
  END;

-- Step 6: Drop old column and rename new one
ALTER TABLE "Claim" DROP COLUMN "status";
ALTER TABLE "Claim" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Claim" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Claim" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Step 7: Drop old enum type
DROP TYPE "ClaimStatus";

-- Step 8: Rename new enum to standard name
ALTER TYPE "ClaimStatus_new" RENAME TO "ClaimStatus";

-- Step 9: Drop old columns
ALTER TABLE "Claim" DROP COLUMN IF EXISTS "amount";
ALTER TABLE "Claim" DROP COLUMN IF EXISTS "approvedAmount";
ALTER TABLE "Claim" DROP COLUMN IF EXISTS "resolvedDate";
ALTER TABLE "Claim" DROP COLUMN IF EXISTS "type";

-- CreateTable ClaimInvoice
CREATE TABLE "ClaimInvoice" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "amountSubmitted" DOUBLE PRECISION NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable ClaimReprocess
CREATE TABLE "ClaimReprocess" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "reprocessDate" DATE NOT NULL,
    "reprocessDescription" TEXT NOT NULL,
    "businessDays" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimReprocess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClaimInvoice_claimId_idx" ON "ClaimInvoice"("claimId");

-- CreateIndex
CREATE INDEX "ClaimInvoice_createdById_idx" ON "ClaimInvoice"("createdById");

-- CreateIndex
CREATE INDEX "ClaimReprocess_claimId_idx" ON "ClaimReprocess"("claimId");

-- CreateIndex
CREATE INDEX "ClaimReprocess_createdById_idx" ON "ClaimReprocess"("createdById");

-- CreateIndex
CREATE INDEX "Claim_updatedById_idx" ON "Claim"("updatedById");

-- CreateIndex
CREATE INDEX "Claim_settlementDate_idx" ON "Claim"("settlementDate");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimInvoice" ADD CONSTRAINT "ClaimInvoice_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimInvoice" ADD CONSTRAINT "ClaimInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimReprocess" ADD CONSTRAINT "ClaimReprocess_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimReprocess" ADD CONSTRAINT "ClaimReprocess_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

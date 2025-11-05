-- DropForeignKey
ALTER TABLE "public"."Claim" DROP CONSTRAINT "Claim_policyId_fkey";

-- AlterTable
ALTER TABLE "Claim" ALTER COLUMN "policyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "previousCoverageType" "CoverageType",
ADD COLUMN     "tierChangedAt" TIMESTAMP(3);

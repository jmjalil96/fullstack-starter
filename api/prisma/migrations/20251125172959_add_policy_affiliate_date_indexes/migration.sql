-- CreateIndex
CREATE INDEX "PolicyAffiliate_policyId_addedAt_idx" ON "PolicyAffiliate"("policyId", "addedAt");

-- CreateIndex
CREATE INDEX "PolicyAffiliate_policyId_removedAt_idx" ON "PolicyAffiliate"("policyId", "removedAt");

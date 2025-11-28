/**
 * DTO for invoice validation endpoint (POST /api/invoices/:id/validate)
 *
 * Uses T+1 lagged billing model:
 * - Invoice M = BASE + ADJUSTMENTS
 * - BASE = (M-1 cutoff snapshot) × (M premium)
 * - ADJUSTMENTS = Activity in window (M-2 cutoff → M-1 cutoff]
 */

import type { InvoiceDetailResponse } from '../views/invoiceDetail.dto.js'

/**
 * Response from POST /api/invoices/:id/validate
 *
 * Returns complete updated invoice with calculated validation fields populated.
 * Following codebase pattern: always return full entity after operations.
 *
 * Invoice status remains unchanged (PENDING) - user must separately transition
 * to VALIDATED/DISCREPANCY via PUT endpoint after reviewing calculations.
 *
 * @example
 * {
 *   "id": "abc123",
 *   "invoiceNumber": "MAPFRE-2025-001",
 *   "status": "PENDING",  // Unchanged
 *   "expectedAmount": 45250,  // ← CALCULATED (base + adjustments)
 *   "expectedAffiliateCount": 90,  // ← CALCULATED (base snapshot count)
 *   "totalAmount": 47000,  // Original from insurer
 *   "actualAffiliateCount": 95,  // Original from insurer
 *   "policies": [
 *     {
 *       "policyNumber": "POL-001",
 *       "expectedAmount": 34500,  // ← CALCULATED
 *       "expectedBreakdown": {  // ← CALCULATED (T+1 billing breakdown)
 *         "base": {
 *           "count": 64,
 *           "amount": 32000,
 *           "byTier": {
 *             "T": { "count": 50, "amount": 25000 },
 *             "TPLUS1": { "count": 10, "amount": 6000 },
 *             "TPLUSF": { "count": 4, "amount": 1000 }
 *           }
 *         },
 *         "adjustments": [
 *           {
 *             "affiliateId": "aff123",
 *             "affiliateName": "Juan Perez",
 *             "type": "JOINED",  // JOINED | LEFT | JOINED_AND_LEFT
 *             "activityDate": "2025-01-10",
 *             "coverageDays": 22,
 *             "amount": 354.84,  // Positive = charge, Negative = credit
 *             "tier": "T"
 *           }
 *         ],
 *         "adjustmentsTotal": 2500,
 *         "total": 34500
 *       },
 *       "expectedAffiliateCount": 64  // ← CALCULATED (base count)
 *     }
 *   ]
 * }
 */
export type ValidateInvoiceResponse = InvoiceDetailResponse

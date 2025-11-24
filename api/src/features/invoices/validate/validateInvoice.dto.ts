/**
 * DTO for invoice validation endpoint (POST /api/invoices/:id/validate)
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
 *   "invoiceNumber": "INV-2025-001",
 *   "status": "PENDING",  // Unchanged
 *   "expectedAmount": 45250,  // ← CALCULATED
 *   "expectedAffiliateCount": 90,  // ← CALCULATED
 *   "totalAmount": 47000,  // Original from insurer
 *   "actualAffiliateCount": 95,  // Original from insurer
 *   "policies": [
 *     {
 *       "policyNumber": "POL-001",
 *       "expectedAmount": 34500,  // ← CALCULATED
 *       "expectedBreakdown": {  // ← CALCULATED
 *         "T": { "fullPeriod": 50, "proRated": 2, "amount": 25100 },
 *         "TPLUS1": { "fullPeriod": 10, "proRated": 1, "amount": 8400 },
 *         "TPLUSF": { "fullPeriod": 1, "proRated": 0, "amount": 1000 }
 *       },
 *       "expectedAffiliateCount": 64  // ← CALCULATED
 *     },
 *     ...more policies
 *   ],
 *   ...all other invoice fields
 * }
 */
export type ValidateInvoiceResponse = InvoiceDetailResponse

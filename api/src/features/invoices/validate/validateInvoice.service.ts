/**
 * validateInvoice.service.ts
 * Service for calculating invoice validation with T+1 lagged billing model
 *
 * T+1 Lagged Billing Model:
 * Invoice M = BASE + ADJUSTMENTS
 * - BASE = (M-1 cutoff snapshot) × (M premium)
 * - ADJUSTMENTS = Activity in window (M-2 cutoff → M-1 cutoff]
 *
 * Critical Rule: Activity after cutoff M cannot appear in invoice M+1. Must wait for M+2.
 *
 * Calculates expected amounts based on:
 * - OWNERS only (not dependents - family tier pricing)
 * - Coverage type premiums (T, TPLUS1, TPLUSF)
 * - Base billing for affiliates in cutoff snapshot
 * - Pro-rata adjustments for mid-period joins/exits
 *
 * Updates:
 * - InvoicePolicy records with expectedAmount, expectedBreakdown, expectedAffiliateCount
 * - Invoice record with aggregated totals
 *
 * Does NOT:
 * - Change invoice status (stays PENDING)
 * - Set countMatches/amountMatches (comparison happens in edit endpoint)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { CoverageType } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import {
  daysBetweenInclusive,
  getAdjustmentWindow,
  getDaysInMonth,
  normalizeToMidnight,
} from '../../../shared/utils/dates.js'

import type { ValidateInvoiceResponse } from './validateInvoice.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

/**
 * Individual adjustment for an affiliate
 */
interface AffiliateAdjustment {
  affiliateId: string
  affiliateName: string
  type: 'JOINED' | 'LEFT' | 'JOINED_AND_LEFT' | 'TIER_CHANGED'
  activityDate: string
  coverageDays: number
  amount: number
  tier: CoverageType
  oldTier?: CoverageType // For TIER_CHANGED: tier before the change
  newTier?: CoverageType // For TIER_CHANGED: tier after the change
}

/**
 * Base breakdown by tier
 */
interface BaseBreakdown {
  T: { count: number; amount: number }
  TPLUS1: { count: number; amount: number }
  TPLUSF: { count: number; amount: number }
}

/**
 * New breakdown structure with base + adjustments
 */
interface BillingBreakdown {
  base: {
    count: number
    amount: number
    byTier: BaseBreakdown
  }
  adjustments: AffiliateAdjustment[]
  adjustmentsTotal: number
  total: number
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Calculate and populate invoice validation fields using T+1 lagged billing
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can run validation
 *
 * Process:
 * - Gets insurer's billing cutoff day
 * - Calculates base cutoff (M-1) and adjustment window (M-2 → M-1)
 * - BASE: Affiliates active at M-1 cutoff × premium
 * - ADJUSTMENTS: Pro-rata for activity in adjustment window
 * - Updates InvoicePolicy with breakdown
 * - Updates Invoice with totals
 * - Status remains unchanged
 *
 * @param userId - ID of user requesting validation
 * @param invoiceId - ID of invoice to validate
 * @returns Complete invoice with calculated validation fields
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If invoice not found
 * @throws {BadRequestError} If invoice has no policies or invalid billing period
 */
export async function calculateInvoiceValidation(
  userId: string,
  invoiceId: string
): Promise<ValidateInvoiceResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Authorization Check
  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized invoice validation attempt')
    throw new ForbiddenError('No tienes permiso para validar facturas')
  }

  // STEP 3: Load Invoice with Insurer (for billingCutoffDay)
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      billingPeriod: true,
      insurer: {
        select: {
          id: true,
          billingCutoffDay: true,
        },
      },
    },
  })

  if (!invoice) {
    throw new NotFoundError('Factura no encontrada')
  }

  if (invoice.status === 'CANCELLED') {
    throw new BadRequestError('No se puede validar una factura cancelada')
  }

  if (!invoice.billingPeriod) {
    throw new BadRequestError('La factura no tiene período de facturación definido')
  }

  // STEP 4: Get Billing Dates
  const cutoffDay = invoice.insurer.billingCutoffDay
  let windowStart: Date, windowEnd: Date, baseCutoff: Date

  try {
    const window = getAdjustmentWindow(invoice.billingPeriod, cutoffDay)
    windowStart = window.windowStart
    windowEnd = window.windowEnd
    baseCutoff = window.baseCutoff
  } catch {
    throw new BadRequestError(`Período de facturación inválido: ${invoice.billingPeriod}`)
  }

  // STEP 5: Load Invoice Policies
  const invoicePolicies = await db.invoicePolicy.findMany({
    where: { invoiceId },
    include: {
      policy: {
        select: {
          id: true,
          policyNumber: true,
          tPremium: true,
          tplus1Premium: true,
          tplusfPremium: true,
        },
      },
    },
  })

  if (invoicePolicies.length === 0) {
    throw new BadRequestError('La factura no tiene pólizas asociadas. Agregue pólizas primero.')
  }

  // STEP 6: Calculate Expected Values in Transaction
  const results = await db.$transaction(async (tx) => {
    // =====================================================================
    // 6a. BATCH QUERY: Load all base owners across all policies (single query)
    // =====================================================================
    const policyIds = invoicePolicies.map((ip) => ip.policy.id)

    const allBaseOwners = await tx.policyAffiliate.findMany({
      where: {
        policyId: { in: policyIds },
        affiliate: { affiliateType: 'OWNER' }, // Filter OWNERS at DB level
        addedAt: { lte: baseCutoff },
        OR: [{ removedAt: { gt: baseCutoff } }, { removedAt: null }],
      },
      include: {
        affiliate: {
          select: {
            id: true,
            coverageType: true,
          },
        },
      },
    })

    // =====================================================================
    // 6b. BATCH QUERY: Load all window owners across all policies (single query)
    // =====================================================================
    const allWindowOwners = await tx.policyAffiliate.findMany({
      where: {
        policyId: { in: policyIds },
        affiliate: { affiliateType: 'OWNER' }, // Filter OWNERS at DB level
        OR: [
          { addedAt: { gt: windowStart, lte: windowEnd } },
          { removedAt: { gt: windowStart, lte: windowEnd } },
        ],
      },
      include: {
        affiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            coverageType: true,
          },
        },
      },
    })

    // =====================================================================
    // 6c. BATCH QUERY: Load all tier-changed owners across all policies
    // =====================================================================
    const allTierChangedOwners = await tx.policyAffiliate.findMany({
      where: {
        policyId: { in: policyIds },
        affiliate: {
          affiliateType: 'OWNER',
          tierChangedAt: { gt: windowStart, lte: windowEnd },
          previousCoverageType: { not: null },
        },
      },
      include: {
        affiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            coverageType: true,
            tierChangedAt: true,
            previousCoverageType: true,
          },
        },
      },
    })

    // =====================================================================
    // 6d. Group results by policyId (O(n) in-memory operation)
    // =====================================================================
    const baseByPolicy = groupByPolicyId(allBaseOwners)
    const windowByPolicy = groupByPolicyId(allWindowOwners)
    const tierChangedByPolicy = groupByPolicyId(allTierChangedOwners)

    // =====================================================================
    // 6d. Calculate breakdowns for each policy
    // =====================================================================
    let totalExpectedAmount = 0
    let totalExpectedCount = 0
    const policyCalculations = []
    const policyUpdates: Array<{
      policyId: string
      data: {
        expectedAmount: number
        expectedBreakdown: Prisma.InputJsonValue
        expectedAffiliateCount: number
      }
    }> = []

    for (const invoicePolicy of invoicePolicies) {
      const policy = invoicePolicy.policy
      const baseOwners = baseByPolicy.get(policy.id) ?? []
      const windowOwners = windowByPolicy.get(policy.id) ?? []

      // Calculate base amount (no pro-rata - they're in the snapshot)
      const baseBreakdown: BaseBreakdown = {
        T: { count: 0, amount: 0 },
        TPLUS1: { count: 0, amount: 0 },
        TPLUSF: { count: 0, amount: 0 },
      }

      for (const owner of baseOwners) {
        const tier = owner.affiliate.coverageType
        if (!tier) {
          logger.warn(
            { policyId: policy.id, affiliateId: owner.affiliateId },
            'Base owner without coverageType - skipping'
          )
          continue
        }

        const premium = getPremiumForTier(policy, tier)
        if (premium == null) {
          logger.warn(
            { policyId: policy.id, policyNumber: policy.policyNumber, tier },
            'Premium not configured for tier - skipping base owner'
          )
          continue
        }

        baseBreakdown[tier].count++
        baseBreakdown[tier].amount += premium
      }

      const baseCount =
        baseBreakdown.T.count + baseBreakdown.TPLUS1.count + baseBreakdown.TPLUSF.count
      const baseAmount =
        baseBreakdown.T.amount + baseBreakdown.TPLUS1.amount + baseBreakdown.TPLUSF.amount

      // Calculate adjustments for window activity
      const adjustments: AffiliateAdjustment[] = []

      for (const owner of windowOwners) {
        const tier = owner.affiliate.coverageType
        if (!tier) {
          logger.warn(
            { policyId: policy.id, affiliateId: owner.affiliateId },
            'Window owner without coverageType - skipping'
          )
          continue
        }

        const premium = getPremiumForTier(policy, tier)
        if (premium == null) {
          logger.warn(
            { policyId: policy.id, policyNumber: policy.policyNumber, tier },
            'Premium not configured for tier - skipping window owner'
          )
          continue
        }

        // Determine activity type and calculate adjustment
        const addedAt = normalizeToMidnight(owner.addedAt)
        const removedAt = owner.removedAt ? normalizeToMidnight(owner.removedAt) : null

        const joinedInWindow = addedAt > windowStart && addedAt <= windowEnd
        const leftInWindow = removedAt !== null && removedAt > windowStart && removedAt <= windowEnd

        if (joinedInWindow && leftInWindow) {
          // JOINED_AND_LEFT in window
          const coverageDays = daysBetweenInclusive(addedAt, removedAt)
          const daysInMonth = getDaysInActivityMonth(addedAt)
          const proRataAmount = (coverageDays / daysInMonth) * premium

          adjustments.push({
            affiliateId: owner.affiliate.id,
            affiliateName: `${owner.affiliate.firstName} ${owner.affiliate.lastName}`,
            type: 'JOINED_AND_LEFT',
            activityDate: addedAt.toISOString().split('T')[0],
            coverageDays,
            amount: Math.round(proRataAmount * 100) / 100,
            tier,
          })
        } else if (joinedInWindow) {
          // JOINED in window
          const daysInMonth = getDaysInActivityMonth(addedAt)
          const dayOfMonth = addedAt.getUTCDate()
          const coverageDays = daysInMonth - dayOfMonth + 1
          const proRataAmount = (coverageDays / daysInMonth) * premium

          adjustments.push({
            affiliateId: owner.affiliate.id,
            affiliateName: `${owner.affiliate.firstName} ${owner.affiliate.lastName}`,
            type: 'JOINED',
            activityDate: addedAt.toISOString().split('T')[0],
            coverageDays,
            amount: Math.round(proRataAmount * 100) / 100,
            tier,
          })
        } else if (removedAt !== null && leftInWindow) {
          // LEFT in window
          const daysInMonth = getDaysInActivityMonth(removedAt)
          const dayOfMonth = removedAt.getUTCDate()
          const coverageDays = dayOfMonth
          const overbilledDays = daysInMonth - coverageDays
          const creditAmount = (overbilledDays / daysInMonth) * premium

          adjustments.push({
            affiliateId: owner.affiliate.id,
            affiliateName: `${owner.affiliate.firstName} ${owner.affiliate.lastName}`,
            type: 'LEFT',
            activityDate: removedAt.toISOString().split('T')[0],
            coverageDays,
            amount: -Math.round(creditAmount * 100) / 100,
            tier,
          })
        }
      }

      // Process tier changes in window
      const tierChangedOwners = tierChangedByPolicy.get(policy.id) ?? []

      for (const owner of tierChangedOwners) {
        const oldTier = owner.affiliate.previousCoverageType
        const newTier = owner.affiliate.coverageType
        const tierChangedAt = owner.affiliate.tierChangedAt

        if (!oldTier || !newTier || !tierChangedAt) continue

        const oldPremium = getPremiumForTier(policy, oldTier)
        const newPremium = getPremiumForTier(policy, newTier)

        if (oldPremium == null || newPremium == null) {
          logger.warn(
            { policyId: policy.id, affiliateId: owner.affiliateId, oldTier, newTier },
            'Premium not configured for tier change - skipping'
          )
          continue
        }

        // Calculate days in the month of the tier change
        const changeDate = normalizeToMidnight(tierChangedAt)
        const daysInMonth = getDaysInActivityMonth(changeDate)
        const dayOfChange = changeDate.getUTCDate()
        const daysAtNewTier = daysInMonth - dayOfChange + 1 // Days from change onwards

        // Credit: Old tier was billed full month, should have been partial
        // Charge: New tier was billed $0, should have been partial
        const oldTierCredit = -((daysAtNewTier / daysInMonth) * oldPremium)
        const newTierCharge = (daysAtNewTier / daysInMonth) * newPremium
        const netAdjustment = oldTierCredit + newTierCharge

        adjustments.push({
          affiliateId: owner.affiliate.id,
          affiliateName: `${owner.affiliate.firstName} ${owner.affiliate.lastName}`,
          type: 'TIER_CHANGED',
          activityDate: changeDate.toISOString().split('T')[0],
          coverageDays: daysAtNewTier,
          amount: Math.round(netAdjustment * 100) / 100,
          tier: newTier,
          oldTier,
          newTier,
        })
      }

      // Calculate policy totals
      const adjustmentsTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
      const policyExpectedAmount = Math.round((baseAmount + adjustmentsTotal) * 100) / 100
      const policyExpectedCount = baseCount

      // Build breakdown structure
      const breakdown: BillingBreakdown = {
        base: {
          count: baseCount,
          amount: Math.round(baseAmount * 100) / 100,
          byTier: {
            T: {
              count: baseBreakdown.T.count,
              amount: Math.round(baseBreakdown.T.amount * 100) / 100,
            },
            TPLUS1: {
              count: baseBreakdown.TPLUS1.count,
              amount: Math.round(baseBreakdown.TPLUS1.amount * 100) / 100,
            },
            TPLUSF: {
              count: baseBreakdown.TPLUSF.count,
              amount: Math.round(baseBreakdown.TPLUSF.amount * 100) / 100,
            },
          },
        },
        adjustments,
        adjustmentsTotal: Math.round(adjustmentsTotal * 100) / 100,
        total: policyExpectedAmount,
      }

      // Collect update for batch execution
      policyUpdates.push({
        policyId: policy.id,
        data: {
          expectedAmount: policyExpectedAmount,
          expectedBreakdown: breakdown as unknown as Prisma.InputJsonValue,
          expectedAffiliateCount: policyExpectedCount,
        },
      })

      // Accumulate totals
      totalExpectedAmount += policyExpectedAmount
      totalExpectedCount += policyExpectedCount

      policyCalculations.push({
        policyNumber: policy.policyNumber,
        expectedAmount: policyExpectedAmount,
        expectedCount: policyExpectedCount,
        adjustmentsCount: adjustments.length,
        breakdown,
      })
    }

    // =====================================================================
    // 6e. BATCH UPDATE: Update all InvoicePolicies in parallel
    // =====================================================================
    await Promise.all(
      policyUpdates.map(({ policyId, data }) =>
        tx.invoicePolicy.update({
          where: { invoiceId_policyId: { invoiceId, policyId } },
          data,
        })
      )
    )

    // =====================================================================
    // 6f. Update Invoice with aggregated totals
    // =====================================================================
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        expectedAmount: Math.round(totalExpectedAmount * 100) / 100,
        expectedAffiliateCount: totalExpectedCount,
      },
    })

    return { totalExpectedAmount, totalExpectedCount, policyCalculations }
  })

  // STEP 7: Load Updated Invoice with Relations
  const updatedInvoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      paymentStatus: true,
      billingPeriod: true,
      totalAmount: true,
      taxAmount: true,
      expectedAffiliateCount: true,
      actualAffiliateCount: true,
      countMatches: true,
      expectedAmount: true,
      amountMatches: true,
      discrepancyNotes: true,
      issueDate: true,
      dueDate: true,
      paymentDate: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      insurerId: true,
      client: { select: { name: true } },
      insurer: { select: { name: true } },
      policies: {
        select: {
          policyId: true,
          expectedAmount: true,
          expectedBreakdown: true,
          expectedAffiliateCount: true,
          addedAt: true,
          policy: { select: { policyNumber: true } },
        },
        orderBy: { addedAt: 'asc' },
      },
    },
  })

  if (!updatedInvoice) {
    throw new NotFoundError('Factura no encontrada después de validación')
  }

  // STEP 8: Transform to Response DTO
  const response: ValidateInvoiceResponse = {
    id: updatedInvoice.id,
    invoiceNumber: updatedInvoice.invoiceNumber,
    status: updatedInvoice.status,
    paymentStatus: updatedInvoice.paymentStatus,
    billingPeriod: updatedInvoice.billingPeriod,
    totalAmount: updatedInvoice.totalAmount,
    taxAmount: updatedInvoice.taxAmount,
    expectedAffiliateCount: updatedInvoice.expectedAffiliateCount,
    actualAffiliateCount: updatedInvoice.actualAffiliateCount,
    countMatches: updatedInvoice.countMatches,
    expectedAmount: updatedInvoice.expectedAmount,
    amountMatches: updatedInvoice.amountMatches,
    discrepancyNotes: updatedInvoice.discrepancyNotes,
    issueDate: updatedInvoice.issueDate.toISOString().split('T')[0],
    dueDate: updatedInvoice.dueDate?.toISOString().split('T')[0] ?? null,
    paymentDate: updatedInvoice.paymentDate?.toISOString().split('T')[0] ?? null,
    createdAt: updatedInvoice.createdAt.toISOString(),
    updatedAt: updatedInvoice.updatedAt.toISOString(),
    clientId: updatedInvoice.clientId,
    clientName: updatedInvoice.client.name,
    insurerId: updatedInvoice.insurerId,
    insurerName: updatedInvoice.insurer.name,
    policies: updatedInvoice.policies.map((ip) => ({
      policyId: ip.policyId,
      policyNumber: ip.policy.policyNumber,
      expectedAmount: ip.expectedAmount,
      expectedBreakdown: ip.expectedBreakdown as Record<string, unknown>,
      expectedAffiliateCount: ip.expectedAffiliateCount,
      addedAt: ip.addedAt.toISOString(),
    })),
  }

  // STEP 9: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      billingPeriod: invoice.billingPeriod,
      cutoffDay,
      baseCutoff: baseCutoff.toISOString().split('T')[0],
      windowStart: windowStart.toISOString().split('T')[0],
      windowEnd: windowEnd.toISOString().split('T')[0],
      policiesCalculated: results.policyCalculations.length,
      totalBaseCount: results.totalExpectedCount,
      expectedAmount: results.totalExpectedAmount,
    },
    'Invoice validation calculated (T+1 lagged billing)'
  )

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 *
 * @param userId - User ID to load
 * @returns User with role data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
    },
  })
}

/**
 * Get premium amount for a coverage tier
 *
 * Maps coverage type to correct premium field on policy
 *
 * @param policy - Policy with premium fields
 * @param tier - Coverage type (T, TPLUS1, TPLUSF)
 * @returns Premium amount or null if not set
 */
function getPremiumForTier(
  policy: { tPremium: number | null; tplus1Premium: number | null; tplusfPremium: number | null },
  tier: CoverageType
): number | null {
  switch (tier) {
    case 'T':
      return policy.tPremium
    case 'TPLUS1':
      return policy.tplus1Premium
    case 'TPLUSF':
      return policy.tplusfPremium
    default:
      return null
  }
}

/**
 * Get the number of days in the month of a given date
 *
 * Used for pro-rata calculations in adjustment window
 *
 * @param date - Date to get month days for
 * @returns Number of days in that month
 */
function getDaysInActivityMonth(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1 // getUTCMonth is 0-indexed
  return getDaysInMonth(year, month)
}

/**
 * Group policy affiliates by policyId
 *
 * Efficiently groups query results for O(n) lookup by policy.
 * Used to avoid N+1 queries when processing multiple policies.
 *
 * @param items - Array of policy affiliates with policyId
 * @returns Map of policyId to array of affiliates
 */
function groupByPolicyId<T extends { policyId: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const existing = map.get(item.policyId)
    if (existing) {
      existing.push(item)
    } else {
      map.set(item.policyId, [item])
    }
  }
  return map
}

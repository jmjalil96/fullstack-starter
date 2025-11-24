/**
 * validateInvoice.service.ts
 * Service for calculating invoice validation with pro-rata billing
 *
 * Calculates expected amounts based on:
 * - OWNERS only (not dependents - family tier pricing)
 * - Pro-rata for mid-period joins/exits (using addedAt/removedAt)
 * - Coverage type premiums (T, TPLUS1, TPLUSF)
 * - Aggregated by tier per policy
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
  maxDate,
  minDate,
  normalizeToMidnight,
  parseBillingPeriod,
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
 * Tier breakdown structure
 */
interface TierBreakdown {
  T: { fullPeriod: number; proRated: number; amount: number }
  TPLUS1: { fullPeriod: number; proRated: number; amount: number }
  TPLUSF: { fullPeriod: number; proRated: number; amount: number }
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Calculate and populate invoice validation fields
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can run validation
 *
 * Process:
 * - Parses billing period to date range
 * - For each policy: queries OWNERS active during period
 * - Calculates pro-rata amounts based on coverage days
 * - Aggregates by coverage tier (T, TPLUS1, TPLUSF)
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

  // STEP 3: Load Invoice
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      billingPeriod: true,
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

  // STEP 4: Parse Billing Period
  let periodStart: Date, periodEnd: Date, daysInPeriod: number

  try {
    const parsed = parseBillingPeriod(invoice.billingPeriod)
    periodStart = parsed.periodStart
    periodEnd = parsed.periodEnd
    daysInPeriod = parsed.daysInPeriod
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
    let totalExpectedAmount = 0
    let totalExpectedCount = 0
    const policyCalculations = []

    for (const invoicePolicy of invoicePolicies) {
      const policy = invoicePolicy.policy

      // 6a. Find OWNERS active during billing period
      const policyAffiliates = await tx.policyAffiliate.findMany({
        where: {
          policyId: policy.id,
          addedAt: { lte: periodEnd },
          OR: [{ removedAt: { gte: periodStart } }, { removedAt: null }],
        },
        include: {
          affiliate: {
            select: {
              affiliateType: true,
              coverageType: true,
            },
          },
        },
      })

      // Filter to OWNERS only (dependents don't count - family tier pricing)
      const owners = policyAffiliates.filter((pa) => pa.affiliate.affiliateType === 'OWNER')

      // 6b. Calculate pro-rata for each owner
      const tierBreakdown: TierBreakdown = {
        T: { fullPeriod: 0, proRated: 0, amount: 0 },
        TPLUS1: { fullPeriod: 0, proRated: 0, amount: 0 },
        TPLUSF: { fullPeriod: 0, proRated: 0, amount: 0 },
      }

      for (const owner of owners) {
        // Calculate coverage window (normalize to midnight for consistent day counting)
        const coverageStart = maxDate(normalizeToMidnight(owner.addedAt), periodStart)
        const coverageEnd = minDate(
          owner.removedAt ? normalizeToMidnight(owner.removedAt) : periodEnd,
          periodEnd
        )

        // Guard against invalid date ranges (defensive)
        if (coverageEnd < coverageStart) {
          logger.warn(
            { policyId: policy.id, affiliateId: owner.affiliateId, coverageStart, coverageEnd },
            'Invalid coverage window (end before start) - skipping owner'
          )
          continue
        }

        // Calculate days active (inclusive)
        const daysActive = daysBetweenInclusive(coverageStart, coverageEnd)
        const isFullPeriod = daysActive === daysInPeriod
        const proRataFactor = daysActive / daysInPeriod

        // Get tier from owner (guard against null)
        const tier = owner.affiliate.coverageType

        if (!tier) {
          logger.warn(
            { policyId: policy.id, affiliateId: owner.affiliateId },
            'Owner without coverageType - skipping'
          )
          continue
        }

        // Get premium for tier
        const premium = getPremiumForTier(policy, tier)

        if (premium == null) {
          logger.warn(
            { policyId: policy.id, policyNumber: policy.policyNumber, tier },
            'Premium not configured for tier - skipping owner'
          )
          continue
        }

        // Calculate pro-rated amount
        const amount = premium * proRataFactor

        // Aggregate by tier
        if (isFullPeriod) {
          tierBreakdown[tier].fullPeriod++
        } else {
          tierBreakdown[tier].proRated++
        }
        tierBreakdown[tier].amount += amount
      }

      // Round tier amounts to 2 decimal places
      for (const tier of ['T', 'TPLUS1', 'TPLUSF'] as CoverageType[]) {
        tierBreakdown[tier].amount = Math.round(tierBreakdown[tier].amount * 100) / 100
      }

      // 6c. Calculate policy totals
      const policyExpectedAmount =
        tierBreakdown.T.amount + tierBreakdown.TPLUS1.amount + tierBreakdown.TPLUSF.amount

      const policyExpectedCount =
        tierBreakdown.T.fullPeriod +
        tierBreakdown.T.proRated +
        tierBreakdown.TPLUS1.fullPeriod +
        tierBreakdown.TPLUS1.proRated +
        tierBreakdown.TPLUSF.fullPeriod +
        tierBreakdown.TPLUSF.proRated

      // 6d. Update InvoicePolicy with calculated breakdown
      await tx.invoicePolicy.update({
        where: {
          invoiceId_policyId: { invoiceId, policyId: policy.id },
        },
        data: {
          expectedAmount: policyExpectedAmount,
          expectedBreakdown: tierBreakdown as unknown as Prisma.InputJsonValue,
          expectedAffiliateCount: policyExpectedCount,
        },
      })

      // Accumulate totals (in memory, not from stale DB data)
      totalExpectedAmount += policyExpectedAmount
      totalExpectedCount += policyExpectedCount

      policyCalculations.push({
        policyNumber: policy.policyNumber,
        expectedAmount: policyExpectedAmount,
        expectedCount: policyExpectedCount,
        breakdown: tierBreakdown,
      })
    }

    // 6e. Update Invoice with aggregated totals
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        expectedAmount: totalExpectedAmount,
        expectedAffiliateCount: totalExpectedCount,
        // Status remains unchanged (PENDING)
        // countMatches, amountMatches remain null (comparison in edit endpoint)
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
      insurerInvoiceNumber: true,
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
      fileUrl: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      uploadedAt: true,
      issueDate: true,
      dueDate: true,
      paymentDate: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      insurerId: true,
      uploadedById: true,
      client: { select: { name: true } },
      insurer: { select: { name: true } },
      uploadedBy: { select: { name: true } },
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
    insurerInvoiceNumber: updatedInvoice.insurerInvoiceNumber,
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
    fileUrl: updatedInvoice.fileUrl,
    fileName: updatedInvoice.fileName,
    fileSize: updatedInvoice.fileSize,
    mimeType: updatedInvoice.mimeType,
    uploadedAt: updatedInvoice.uploadedAt?.toISOString() ?? null,
    issueDate: updatedInvoice.issueDate.toISOString().split('T')[0],
    dueDate: updatedInvoice.dueDate?.toISOString().split('T')[0] ?? null,
    paymentDate: updatedInvoice.paymentDate?.toISOString().split('T')[0] ?? null,
    createdAt: updatedInvoice.createdAt.toISOString(),
    updatedAt: updatedInvoice.updatedAt.toISOString(),
    clientId: updatedInvoice.clientId,
    clientName: updatedInvoice.client.name,
    insurerId: updatedInvoice.insurerId,
    insurerName: updatedInvoice.insurer.name,
    uploadedById: updatedInvoice.uploadedById,
    uploadedByName: updatedInvoice.uploadedBy?.name ?? null,
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
      policiesCalculated: results.policyCalculations.length,
      totalOwners: results.totalExpectedCount,
      expectedAmount: results.totalExpectedAmount,
    },
    'Invoice validation calculated'
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

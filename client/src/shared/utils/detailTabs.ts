/**
 * Detail page tab configuration utilities
 * Provides helper functions to generate tab configurations for entity detail views
 */

import type { AffiliateDetailResponse } from '../types/affiliates'
import type { ClaimDetailResponse } from '../types/claims'
import type { ClientDetailResponse } from '../types/clients'
import type { PolicyDetailResponse } from '../types/policies'

/**
 * Tab configuration for detail page navigation
 */
export interface DetailTab {
  /** Tab display label */
  label: string
  /** Route path segment (empty string for overview/default tab) */
  path: string
  /** Optional count badge */
  count?: number
  /** Optional icon component */
  icon?: React.FC<{ className?: string }>
}

/**
 * Count data for affiliate tabs
 */
export interface AffiliateCounts {
  policies?: number
  claims?: number
}

/**
 * Get tabs for affiliate detail view
 *
 * @param affiliate - Affiliate detail data
 * @param counts - Optional count data for badges
 * @returns Array of tab configurations
 *
 * @example
 * const tabs = getAffiliateTabs(affiliate, { policies: 3, claims: 12 })
 * // Returns: [{ label: 'Resumen', path: '' }, { label: 'Pólizas', path: 'polizas', count: 3 }, ...]
 */
export function getAffiliateTabs(
  _affiliate: AffiliateDetailResponse,
  counts?: AffiliateCounts
): DetailTab[] {
  const base: DetailTab[] = [
    { label: 'Resumen', path: '' },
    { label: 'Pólizas', path: 'polizas', count: counts?.policies },
    // TODO: Add back when implemented:
    // { label: 'Reclamos', path: 'reclamos', count: counts?.claims },
  ]

  // TODO: Add Familia tab when family tab route is implemented
  // if (affiliate.affiliateType === 'DEPENDENT' && affiliate.primaryAffiliateId) {
  //   base.splice(1, 0, { label: 'Familia', path: 'familia' })
  // }

  return base
}

/**
 * Count data for client tabs
 */
export interface ClientCounts {
  policies?: number
  affiliates?: number
  invoices?: number
}

/**
 * Get tabs for client detail view
 *
 * @param client - Client detail data
 * @param counts - Optional count data for badges
 * @returns Array of tab configurations
 *
 * @example
 * const tabs = getClientTabs(client, { policies: 5, affiliates: 25, invoices: 10 })
 */
export function getClientTabs(
  _client: ClientDetailResponse,
  counts?: ClientCounts
): DetailTab[] {
  return [
    { label: 'Resumen', path: '' },
    { label: 'Pólizas', path: 'polizas', count: counts?.policies },
    { label: 'Afiliados', path: 'afiliados', count: counts?.affiliates },
    { label: 'Facturas', path: 'facturas', count: counts?.invoices },
  ]
}

/**
 * Count data for policy tabs
 */
export interface PolicyCounts {
  affiliates?: number
  claims?: number
  invoices?: number
}

/**
 * Get tabs for policy detail view
 *
 * @param policy - Policy detail data
 * @param counts - Optional count data for badges
 * @returns Array of tab configurations
 *
 * @example
 * const tabs = getPolicyTabs(policy, { affiliates: 50, claims: 8, invoices: 3 })
 */
export function getPolicyTabs(
  _policy: PolicyDetailResponse,
  counts?: PolicyCounts
): DetailTab[] {
  return [
    { label: 'Resumen', path: '' },
    { label: 'Afiliados', path: 'afiliados', count: counts?.affiliates },
    { label: 'Reclamos', path: 'reclamos', count: counts?.claims },
    { label: 'Facturas', path: 'facturas', count: counts?.invoices },
  ]
}

/**
 * Count data for claim tabs
 */
export interface ClaimCounts {
  timelineItems?: number
  documents?: number
}

/**
 * Get tabs for claim detail view
 *
 * @param claim - Claim detail data
 * @param counts - Optional count data for badges
 * @returns Array of tab configurations
 *
 * @example
 * const tabs = getClaimTabs(claim, { timelineItems: 5, documents: 3 })
 */
export function getClaimTabs(
  _claim: ClaimDetailResponse,
  counts?: ClaimCounts
): DetailTab[] {
  return [
    { label: 'Resumen', path: '' },
    { label: 'Timeline', path: 'timeline', count: counts?.timelineItems },
    { label: 'Documentos', path: 'documentos', count: counts?.documents },
  ]
}

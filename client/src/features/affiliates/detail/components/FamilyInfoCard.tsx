/**
 * FamilyInfoCard - Displays primary affiliate information for dependents
 * Only shown when affiliate is a DEPENDENT with a primary affiliate
 */

import { Link } from 'react-router-dom'

import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'

/**
 * Props for FamilyInfoCard component
 */
interface FamilyInfoCardProps {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse
}

/**
 * FamilyInfoCard - Shows family relationship information
 *
 * Features:
 * - Conditional rendering (only for DEPENDENT affiliates)
 * - Link to primary affiliate detail page
 * - Hover states for better UX
 * - Family/users icon
 * - Matches card styling from ClientDetailsCard
 *
 * Conditional Display:
 * - Only renders if affiliateType === 'DEPENDENT' AND primaryAffiliateId exists
 *
 * @example
 * <FamilyInfoCard affiliate={affiliate} />
 */
export function FamilyInfoCard({ affiliate }: FamilyInfoCardProps) {
  // Only render for dependents with a primary affiliate
  if (affiliate.affiliateType !== 'DEPENDENT' || !affiliate.primaryAffiliateId) {
    return null
  }

  // Format primary affiliate full name
  const primaryAffiliateName = [
    affiliate.primaryAffiliateFirstName,
    affiliate.primaryAffiliateLastName,
  ]
    .filter(Boolean)
    .join(' ') || 'No especificado'

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6">
      {/* Card Title with Icon */}
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[var(--color-border)]">
        {/* Family/Users Icon (Heroicons style) */}
        <svg
          className="h-5 w-5 text-[var(--color-navy)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-[var(--color-navy)]">
          Información Familiar
        </h3>
      </div>

      {/* Primary Affiliate Information */}
      <div>
        <div className="block text-sm font-medium text-[var(--color-navy)] mb-2">
          Afiliado Principal
        </div>
        <div className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
          <Link
            to={`/clientes/afiliados/${affiliate.primaryAffiliateId}`}
            className="text-[var(--color-teal)] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded inline-flex items-center gap-1.5 transition-colors"
            aria-label={`Ver afiliado principal ${primaryAffiliateName}`}
          >
            {primaryAffiliateName}
            {/* Arrow icon for external link indicator */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

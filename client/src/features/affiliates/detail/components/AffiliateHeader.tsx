/**
 * AffiliateHeader - Header section for affiliate detail page
 * Shows affiliate name, type, active status, and key metadata
 */

import { Link } from 'react-router-dom'

import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'
import { IsActiveBadge } from '../../../clients/views/components/IsActiveBadge'
import { TypeBadge } from '../../views/components/TypeBadge'

/**
 * Props for AffiliateHeader component
 */
interface AffiliateHeaderProps {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse
}

/**
 * AffiliateHeader - Header section with navigation, title, and metadata
 *
 * Features:
 * - Back link to affiliates list
 * - Affiliate full name as title with type and active status badges
 * - Key metadata (Affiliate ID)
 * - Responsive layout (stacks on mobile)
 * - Accessible (aria-label, semantic HTML)
 *
 * @example
 * <AffiliateHeader affiliate={affiliate} />
 */
export function AffiliateHeader({ affiliate }: AffiliateHeaderProps) {
  const fullName = `${affiliate.firstName} ${affiliate.lastName}`

  return (
    <header className="mb-8">
      {/* Back Link */}
      <Link
        to="/clientes/afiliados"
        aria-label="Volver a Afiliados"
        className="inline-flex items-center gap-2 text-[var(--color-teal)] hover:text-[var(--color-teal)]/80 transition-colors mb-4"
      >
        <span aria-hidden>←</span>
        Volver a Afiliados
      </Link>

      {/* Title + Badges */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] break-words">
          {fullName}
        </h1>

        <div className="flex items-center gap-2">
          <TypeBadge type={affiliate.affiliateType} />
          <IsActiveBadge isActive={affiliate.isActive} />
        </div>
      </div>

      {/* Meta Information - Affiliate ID */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-secondary)]">
        <span>
          ID: <strong>{affiliate.id}</strong>
        </span>
      </div>
    </header>
  )
}

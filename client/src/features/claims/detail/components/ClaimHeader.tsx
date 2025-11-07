/**
 * ClaimHeader - Header section for claim detail page
 * Shows claim number, status, and key metadata
 */

import { Link } from 'react-router-dom'

import type { ClaimDetailResponse } from '../../../../shared/types/claims'
import { StatusBadge } from '../../views/components'

/**
 * Props for ClaimHeader component
 */
interface ClaimHeaderProps {
  /** Claim detail data */
  claim: ClaimDetailResponse
}

/**
 * ClaimHeader - Header section with navigation, title, and metadata
 *
 * Features:
 * - Back link to claims list
 * - Claim number as title with status badge
 * - Key metadata (client, affiliate, patient)
 * - Responsive layout (stacks on mobile)
 * - Accessible (aria-label, semantic HTML)
 *
 * @example
 * <ClaimHeader claim={claim} />
 */
export function ClaimHeader({ claim }: ClaimHeaderProps) {
  return (
    <header className="mb-8">
      {/* Back Link */}
      <Link
        to="/reclamos/mis-reclamos"
        aria-label="Volver a Mis Reclamos"
        className="inline-flex items-center gap-2 text-[var(--color-teal)] hover:text-[var(--color-teal)]/80 transition-colors mb-4"
      >
        <span aria-hidden>←</span>
        Volver a Mis Reclamos
      </Link>

      {/* Title + Status Badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] break-words">
          Reclamo {claim.claimNumber}
        </h1>

        <StatusBadge status={claim.status} className="text-base px-4 py-2" />
      </div>

      {/* Meta Information - Client, Affiliate, Patient */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-secondary)]">
        <span>
          Cliente: <strong>{claim.clientName}</strong>
        </span>
        <span className="hidden sm:inline">•</span>
        <span>
          Afiliado: <strong>{claim.affiliateFirstName} {claim.affiliateLastName}</strong>
        </span>
        <span className="hidden sm:inline">•</span>
        <span>
          Paciente: <strong>{claim.patientFirstName} {claim.patientLastName}</strong>
          {claim.patientRelationship === 'dependent' && (
            <span className="ml-1 text-xs italic">(dependiente)</span>
          )}
        </span>
      </div>
    </header>
  )
}

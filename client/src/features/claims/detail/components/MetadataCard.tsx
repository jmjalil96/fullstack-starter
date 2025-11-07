/**
 * MetadataCard - Sidebar card showing claim metadata
 * Displays creation info, audit dates, and technical details
 */

import type { ClaimDetailResponse } from '../../../../shared/types/claims'

/**
 * Props for MetadataCard component
 */
interface MetadataCardProps {
  /** Claim detail data */
  claim: ClaimDetailResponse
}

/**
 * Format ISO datetime string to localized datetime with time
 * Safe parser with NaN check
 */
const formatDateTime = (isoString: string): string => {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * MetadataCard - Compact metadata display for sidebar
 *
 * Features:
 * - Created by (user name or "Sistema")
 * - Created at (with time)
 * - Updated at (with time)
 * - Claim sequence ID (technical)
 * - Semantic definition list markup
 * - Compact sidebar-friendly sizing
 *
 * @example
 * <MetadataCard claim={claim} />
 */
export function MetadataCard({ claim }: MetadataCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">
        Información del Registro
      </h3>

      <dl className="space-y-3 text-sm">
        {/* Created By */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Creado por</dt>
          <dd className="text-[var(--color-text-primary)] font-medium">
            {claim.createdByName || 'Sistema'}
          </dd>
        </div>

        {/* Created At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Fecha de creación</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(claim.createdAt)}</dd>
        </div>

        {/* Updated At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Última modificación</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(claim.updatedAt)}</dd>
        </div>

        {/* Claim Sequence - Technical Info */}
        <div className="pt-3 border-t border-[var(--color-border)]">
          <dt className="text-xs text-[var(--color-text-light)] mb-1">ID Secuencia</dt>
          <dd className="text-[var(--color-text-secondary)] text-xs font-mono">
            #{claim.claimSequence}
          </dd>
        </div>
      </dl>
    </div>
  )
}

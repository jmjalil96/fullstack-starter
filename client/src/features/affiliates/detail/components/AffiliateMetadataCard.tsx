/**
 * AffiliateMetadataCard - Sidebar card showing affiliate metadata
 * Displays audit dates and status information for affiliate records
 */

import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'

/**
 * Props for AffiliateMetadataCard component
 */
interface AffiliateMetadataCardProps {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse
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
 * AffiliateMetadataCard - Compact metadata display for sidebar
 *
 * Features:
 * - Created at (with time)
 * - Updated at (with time)
 * - Active status (with badge)
 * - User account status (Yes/No)
 * - Semantic definition list markup
 * - Compact sidebar-friendly sizing
 *
 * @example
 * <AffiliateMetadataCard affiliate={affiliate} />
 */
export function AffiliateMetadataCard({ affiliate }: AffiliateMetadataCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">
        Información del Registro
      </h3>

      <dl className="space-y-3 text-sm">
        {/* Created At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Fecha de creación</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(affiliate.createdAt)}</dd>
        </div>

        {/* Updated At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Última actualización</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(affiliate.updatedAt)}</dd>
        </div>

        {/* Active Status */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Estado</dt>
          <dd>
            {affiliate.isActive ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Inactivo
              </span>
            )}
          </dd>
        </div>

        {/* User Account Status */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Cuenta de usuario</dt>
          <dd className="text-[var(--color-text-secondary)]">
            {affiliate.hasUserAccount ? 'Sí' : 'No'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

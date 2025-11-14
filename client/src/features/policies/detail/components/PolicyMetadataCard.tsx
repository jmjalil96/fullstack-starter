/**
 * PolicyMetadataCard - Sidebar card showing policy metadata
 * Displays creation and update timestamps
 */

import type { PolicyDetailResponse } from '../../../../shared/types/policies'

/**
 * Props for PolicyMetadataCard component
 */
interface PolicyMetadataCardProps {
  /** Policy detail data */
  policy: PolicyDetailResponse
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
 * PolicyMetadataCard - Compact metadata display for sidebar
 *
 * Features:
 * - Created at (with time)
 * - Updated at (with time)
 * - Spanish locale formatting (dd/mm/yyyy hh:mm)
 * - Semantic definition list markup
 * - Compact sidebar-friendly sizing
 *
 * @example
 * <PolicyMetadataCard policy={policy} />
 */
export function PolicyMetadataCard({ policy }: PolicyMetadataCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">
        Información del Registro
      </h3>

      <dl className="space-y-3 text-sm">
        {/* Created At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Creado el</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(policy.createdAt)}</dd>
        </div>

        {/* Updated At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Actualizado el</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(policy.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  )
}

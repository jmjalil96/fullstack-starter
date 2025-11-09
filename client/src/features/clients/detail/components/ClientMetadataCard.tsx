/**
 * ClientMetadataCard - Sidebar card showing client metadata
 * Displays audit dates for client records
 */

import type { ClientDetailResponse } from '../../../../shared/types/clients'

/**
 * Props for ClientMetadataCard component
 */
interface ClientMetadataCardProps {
  /** Client detail data */
  client: ClientDetailResponse
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
 * ClientMetadataCard - Compact metadata display for sidebar
 *
 * Features:
 * - Created at (with time)
 * - Updated at (with time)
 * - Semantic definition list markup
 * - Compact sidebar-friendly sizing
 *
 * @example
 * <ClientMetadataCard client={client} />
 */
export function ClientMetadataCard({ client }: ClientMetadataCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">
        Información del Registro
      </h3>

      <dl className="space-y-3 text-sm">
        {/* Created At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Fecha de creación</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(client.createdAt)}</dd>
        </div>

        {/* Updated At */}
        <div>
          <dt className="text-xs text-[var(--color-text-light)] mb-1">Última modificación</dt>
          <dd className="text-[var(--color-text-secondary)]">{formatDateTime(client.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  )
}

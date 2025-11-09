/**
 * ClientHeader - Header section for client detail page
 * Shows client name, active status, and key metadata
 */

import { Link } from 'react-router-dom'

import type { ClientDetailResponse } from '../../../../shared/types/clients'
import { IsActiveBadge } from '../../views/components/IsActiveBadge'

/**
 * Props for ClientHeader component
 */
interface ClientHeaderProps {
  /** Client detail data */
  client: ClientDetailResponse
}

/**
 * ClientHeader - Header section with navigation, title, and metadata
 *
 * Features:
 * - Back link to clients list
 * - Client name as title with active status badge
 * - Key metadata (RUC/Tax ID)
 * - Responsive layout (stacks on mobile)
 * - Accessible (aria-label, semantic HTML)
 *
 * @example
 * <ClientHeader client={client} />
 */
export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <header className="mb-8">
      {/* Back Link */}
      <Link
        to="/clientes/lista"
        aria-label="Volver a Clientes"
        className="inline-flex items-center gap-2 text-[var(--color-teal)] hover:text-[var(--color-teal)]/80 transition-colors mb-4"
      >
        <span aria-hidden>←</span>
        Volver a Clientes
      </Link>

      {/* Title + Active Status Badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] break-words">
          {client.name}
        </h1>

        <IsActiveBadge isActive={client.isActive} />
      </div>

      {/* Meta Information - Tax ID */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-secondary)]">
        <span>
          RUC: <strong>{client.taxId}</strong>
        </span>
      </div>
    </header>
  )
}

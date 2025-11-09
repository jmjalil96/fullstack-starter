/**
 * ClientCard - Card display for a single client in list view
 */

import type { KeyboardEvent } from 'react'

import { IsActiveBadge } from './IsActiveBadge'

/**
 * Client data shape (mirrors backend ClientListItemResponse)
 */
interface ClientListItem {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
}

/**
 * Props for ClientCard component
 */
interface ClientCardProps {
  /** Client data to display */
  client: ClientListItem
  /** Callback when card is clicked (navigate to detail) */
  onClick?: (clientId: string) => void
}

/**
 * Format ISO date to Spanish locale
 */
const formatDate = (isoString: string): string => {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * ClientCard - Card-based display for client list item
 *
 * Features:
 * - Clickable card (navigate to detail)
 * - IsActiveBadge in top-right corner
 * - Company name + taxId prominent
 * - Contact info (email/phone) if available
 * - Created date
 * - Hover effect
 * - Semantic article markup
 *
 * @example
 * <ClientCard
 *   client={client}
 *   onClick={(id) => navigate(`/clientes/${id}`)}
 * />
 */
export function ClientCard({ client, onClick }: ClientCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(client.id)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="group bg-white border border-[var(--color-border)] rounded-lg p-5 hover:shadow-md hover:border-[var(--color-teal)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] focus:ring-offset-2"
    >
      {/* Header: Name + Arrow */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[var(--color-navy)]">
            {client.name}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            RUC: {client.taxId}
          </p>
        </div>
        {/* Hover arrow indicator */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-[var(--color-teal)] opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[var(--color-text-secondary)] truncate">{client.email}</span>
          </div>
        )}

        {client.phone && (
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="text-[var(--color-text-secondary)]">{client.phone}</span>
          </div>
        )}
      </div>

      {/* Footer: Created date + Badge */}
      <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--color-text-light)]">
          Creado el {formatDate(client.createdAt)}
        </p>
        <IsActiveBadge isActive={client.isActive} />
      </div>
    </div>
  )
}

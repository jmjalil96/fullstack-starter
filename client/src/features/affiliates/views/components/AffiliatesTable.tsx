/**
 * AffiliatesTable - Table display for affiliates list
 */

import { useNavigate } from 'react-router-dom'

import type { AffiliateListItemResponse } from '../../../../shared/types/affiliates'
import { IsActiveBadge } from '../../../clients/views/components/IsActiveBadge'

import { TypeBadge } from './TypeBadge'

/**
 * Props for AffiliatesTable component
 */
interface AffiliatesTableProps {
  /** Array of affiliates to display */
  affiliates: AffiliateListItemResponse[]
  /** Loading state (for overlay during refetch) */
  loading?: boolean
}

/**
 * Helper: Format full name
 */
const formatName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`
}

/**
 * Helper: Format document display
 * Returns '—' if both documentType and documentNumber are null
 */
const formatDocument = (
  documentType: string | null,
  documentNumber: string | null
): string => {
  if (!documentType && !documentNumber) return '—'
  if (!documentType) return documentNumber || '—'
  if (!documentNumber) return documentType
  return `${documentType} ${documentNumber}`
}

/**
 * AffiliatesTable - Display affiliates in table format
 *
 * Features:
 * - 8 columns with formatted data
 * - Clickable rows for navigation
 * - TypeBadge for affiliate type
 * - IsActiveBadge for status
 * - Actions column with "Ver" button
 * - Mobile responsive (horizontal scroll)
 * - Empty state handling
 * - Accessible table structure
 * - Hover effects
 *
 * @example
 * <AffiliatesTable
 *   affiliates={affiliates}
 *   loading={loading}
 * />
 */
export function AffiliatesTable({
  affiliates,
  loading = false,
}: AffiliatesTableProps) {
  const navigate = useNavigate()

  /**
   * Handle row click for navigation
   */
  const handleRowClick = (affiliateId: string) => {
    navigate(`/clientes/afiliados/${affiliateId}`)
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm overflow-hidden relative">
      {/* Semi-transparent overlay during loading */}
      {loading && (
        <div
          className="absolute inset-0 bg-white/70 z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          {/* Screen reader caption */}
          <caption className="sr-only">Lista de afiliados</caption>

          {/* Table Header */}
          <thead className="bg-[var(--color-navy)]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Tipo
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Cliente
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Documento
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Cobertura
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--color-border)]" aria-busy={loading}>
            {/* Empty State */}
            {affiliates.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                  No se encontraron afiliados
                </td>
              </tr>
            )}

            {/* Affiliate Rows */}
            {affiliates.map((affiliate) => (
              <tr
                key={affiliate.id}
                onClick={() => handleRowClick(affiliate.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Full Name (Bold, Primary Text) */}
                <td className="px-4 py-3 text-sm">
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {formatName(affiliate.firstName, affiliate.lastName)}
                  </span>
                </td>

                {/* Affiliate Type Badge */}
                <td className="px-4 py-3 text-sm">
                  <TypeBadge type={affiliate.affiliateType} />
                </td>

                {/* Client Name (truncate if long) */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  <div className="max-w-[200px] truncate" title={affiliate.clientName}>
                    {affiliate.clientName}
                  </div>
                </td>

                {/* Email (gray text if null) */}
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      affiliate.email
                        ? 'text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)]'
                    }
                  >
                    {affiliate.email || '—'}
                  </span>
                </td>

                {/* Document */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {formatDocument(affiliate.documentType, affiliate.documentNumber)}
                </td>

                {/* Coverage Type */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {affiliate.coverageType || '—'}
                </td>

                {/* Active Status Badge */}
                <td className="px-4 py-3 text-sm">
                  <IsActiveBadge isActive={affiliate.isActive} />
                </td>

                {/* Actions Column - View Button */}
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/clientes/afiliados/${affiliate.id}`)
                    }}
                    className="text-[var(--color-teal)] hover:text-[var(--color-teal-dark)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded px-2 py-1"
                    aria-label={`Ver detalles de ${formatName(affiliate.firstName, affiliate.lastName)}`}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

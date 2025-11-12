/**
 * ClaimsTable - Table display for claims list
 */

import { Link } from 'react-router-dom'

import type { ClaimListItemResponse } from '../../../../shared/types/claims'

import { StatusBadge } from './StatusBadge'

/**
 * Props for ClaimsTable component
 */
interface ClaimsTableProps {
  /** Array of claims to display */
  claims: ClaimListItemResponse[]
  /** Loading state (for overlay during refetch) */
  loading?: boolean
  /** Currency code for amount formatting (default: 'USD') */
  currency?: string
}

/**
 * Helper: Format date to Spanish locale
 * Returns 'Pendiente' if null, '—' if invalid
 */
const formatDate = (isoString: string | null): string => {
  if (!isoString) return 'Pendiente'

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—' // Invalid date fallback

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Helper: Format currency amount
 * Returns 'Pendiente' if null
 */
const formatCurrency = (amount: number | null, currency: string): string => {
  if (amount === null) return 'Pendiente'

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Helper: Format full name
 */
const formatName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`
}

/**
 * ClaimsTable - Display claims in table format
 *
 * Features:
 * - 9 columns with formatted data
 * - Claim number link for navigation
 * - StatusBadge for visual status
 * - Actions column with "Ver" button
 * - Mobile responsive (horizontal scroll)
 * - Empty state handling
 * - Accessible table structure
 *
 * @example
 * <ClaimsTable
 *   claims={claims}
 *   loading={loading}
 * />
 */
export function ClaimsTable({
  claims,
  loading = false,
  currency = 'USD',
}: ClaimsTableProps) {
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
          <caption className="sr-only">Lista de reclamos</caption>

          {/* Table Header */}
          <thead className="bg-[var(--color-navy)]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Número de Reclamo
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
                Cliente
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Afiliado
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Paciente
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Monto
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Fecha de Envío
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Creado
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
            {claims.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                  No se encontraron reclamos
                </td>
              </tr>
            )}

            {/* Claim Rows */}
            {claims.map((claim) => (
              <tr
                key={claim.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Claim Number (Link - supports Cmd+Click for new tab) */}
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/reclamos/${claim.id}`}
                    className="text-[var(--color-teal)] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded"
                    aria-label={`Abrir reclamo ${claim.claimNumber}`}
                  >
                    {claim.claimNumber}
                  </Link>
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={claim.status} />
                </td>

                {/* Client Name */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {claim.clientName}
                </td>

                {/* Affiliate Name */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {formatName(claim.affiliateFirstName, claim.affiliateLastName)}
                </td>

                {/* Patient Name */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {formatName(claim.patientFirstName, claim.patientLastName)}
                </td>

                {/* Amount */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {formatCurrency(claim.amount, currency)}
                </td>

                {/* Submitted Date */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  {formatDate(claim.submittedDate)}
                </td>

                {/* Created Date */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  {formatDate(claim.createdAt)}
                </td>

                {/* Actions Column - View Button */}
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/reclamos/${claim.id}`}
                    className="text-[var(--color-teal)] hover:text-[var(--color-teal-dark)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded px-2 py-1"
                    aria-label={`Ver detalles de reclamo ${claim.claimNumber}`}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

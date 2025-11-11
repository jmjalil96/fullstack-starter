/**
 * PoliciesTable - Table display for policies list
 */

import { Link } from 'react-router-dom'

import type { PolicyListItemResponse } from '../../../../shared/types/policies'

import { StatusBadge } from './StatusBadge'

/**
 * Props for PoliciesTable component
 */
interface PoliciesTableProps {
  /** Array of policies to display */
  policies: PolicyListItemResponse[]
  /** Handler for policy row click */
  onPolicyClick: (policyId: string) => void
  /** Loading state (for future skeleton) */
  loading?: boolean
}

/**
 * Helper: Format date to Spanish locale
 * Returns '—' if invalid
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '—'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—' // Invalid date fallback

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * PoliciesTable - Display policies in table format
 *
 * Features:
 * - 7 columns with formatted data
 * - Clickable rows (whole row + policy number link)
 * - StatusBadge for visual status
 * - Client and Insurer links (client always links, insurer if detail exists)
 * - Keyboard navigation (Enter/Space on rows)
 * - Mobile responsive (horizontal scroll)
 * - Empty state handling
 * - Accessible table structure
 * - Hover effects
 *
 * @example
 * <PoliciesTable
 *   policies={policies}
 *   onPolicyClick={(id) => navigate(`/polizas/${id}`)}
 *   loading={loading}
 * />
 */
export function PoliciesTable({
  policies,
  onPolicyClick,
  loading = false,
}: PoliciesTableProps) {
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
          <caption className="sr-only">Lista de pólizas</caption>

          {/* Table Header */}
          <thead className="bg-[var(--color-navy)]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Número de Póliza
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
                Aseguradora
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Fecha de Inicio
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Fecha de Fin
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
            {policies.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                  No se encontraron pólizas
                </td>
              </tr>
            )}

            {/* Policy Rows */}
            {policies.map((policy) => (
              <tr
                key={policy.id}
                onClick={() => onPolicyClick(policy.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPolicyClick(policy.id)
                  }
                }}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                tabIndex={0}
                role="button"
                aria-label={`Ver detalles de póliza ${policy.policyNumber}`}
              >
                {/* Policy Number (Link - supports Cmd+Click for new tab) */}
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/clientes/polizas/${policy.id}`}
                    className="text-[var(--color-teal)] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded"
                    aria-label={`Abrir póliza ${policy.policyNumber}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {policy.policyNumber}
                  </Link>
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={policy.status} />
                </td>

                {/* Type */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {policy.type || '—'}
                </td>

                {/* Client Name (Link to client detail) */}
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/clientes/${policy.clientId}`}
                    className="text-[var(--color-teal)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded"
                    aria-label={`Ver cliente ${policy.clientName}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {policy.clientName}
                  </Link>
                </td>

                {/* Insurer Name (plain text for now - can be made linkable if insurer detail exists) */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {policy.insurerName}
                </td>

                {/* Start Date */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  {formatDate(policy.startDate)}
                </td>

                {/* End Date */}
                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  {formatDate(policy.endDate)}
                </td>

                {/* Actions Column - View Button */}
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPolicyClick(policy.id)
                    }}
                    className="text-[var(--color-teal)] hover:text-[var(--color-teal-dark)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded px-2 py-1"
                    aria-label={`Ver detalles de póliza ${policy.policyNumber}`}
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

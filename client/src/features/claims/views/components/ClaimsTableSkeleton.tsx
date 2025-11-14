/**
 * ClaimsTableSkeleton - Loading skeleton for claims table
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

/**
 * ClaimsTableSkeleton - Placeholder displayed while claims are loading
 *
 * Features:
 * - Matches ClaimsTable structure with 9 columns
 * - 5 skeleton rows for consistent loading appearance
 * - Animated pulse effect
 * - Accessible loading state
 * - Responsive design with horizontal scroll
 *
 * @example
 * {loading ? <ClaimsTableSkeleton /> : <ClaimsTable claims={claims} />}
 */
export function ClaimsTableSkeleton() {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm overflow-hidden">
      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          {/* Screen reader caption */}
          <caption className="sr-only">Cargando reclamos</caption>

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

          {/* Table Body with Skeleton Rows */}
          <tbody className="divide-y divide-[var(--color-border)]" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {/* Claim Number */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-28 rounded-full" />
                </td>

                {/* Client Name */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>

                {/* Affiliate Name */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>

                {/* Patient Name */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>

                {/* Amount */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>

                {/* Submitted Date */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* Created Date */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <Skeleton className="h-8 w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

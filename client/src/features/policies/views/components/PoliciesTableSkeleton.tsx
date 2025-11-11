/**
 * PoliciesTableSkeleton - Loading skeleton for policies table
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

/**
 * PoliciesTableSkeleton - Placeholder displayed while policies are loading
 *
 * Features:
 * - Matches PoliciesTable structure with 7 columns
 * - 5 skeleton rows for consistent loading appearance
 * - Animated pulse effect
 * - Accessible loading state
 * - Responsive design with horizontal scroll
 *
 * @example
 * {loading ? <PoliciesTableSkeleton /> : <PoliciesTable policies={policies} />}
 */
export function PoliciesTableSkeleton() {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm overflow-hidden">
      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          {/* Screen reader caption */}
          <caption className="sr-only">Cargando pólizas</caption>

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

          {/* Table Body with Skeleton Rows */}
          <tbody className="divide-y divide-[var(--color-border)]" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {/* Policy Number */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>

                {/* Client Name */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>

                {/* Insurer */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>

                {/* Start Date */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* End Date */}
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

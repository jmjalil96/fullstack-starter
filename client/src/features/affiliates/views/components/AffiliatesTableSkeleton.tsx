/**
 * AffiliatesTableSkeleton - Loading skeleton for affiliates table
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

/**
 * AffiliatesTableSkeleton - Placeholder displayed while affiliates are loading
 *
 * Features:
 * - Matches AffiliatesTable structure with 8 columns
 * - 5 skeleton rows for consistent loading appearance
 * - Animated pulse effect
 * - Accessible loading state
 * - Responsive design with horizontal scroll
 *
 * @example
 * {loading ? <AffiliatesTableSkeleton /> : <AffiliatesTable affiliates={affiliates} />}
 */
export function AffiliatesTableSkeleton() {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm overflow-hidden">
      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          {/* Screen reader caption */}
          <caption className="sr-only">Cargando afiliados</caption>

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

          {/* Table Body with Skeleton Rows */}
          <tbody className="divide-y divide-[var(--color-border)]" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {/* Name */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>

                {/* Client */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>

                {/* Email */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>

                {/* Document */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>

                {/* Coverage */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
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

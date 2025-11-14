/**
 * PolicyAffiliatesSkeleton - Loading skeleton for policy affiliates table
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

export function PolicyAffiliatesSkeleton() {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <caption className="sr-only">Cargando afiliados de la póliza</caption>
          <thead className="bg-[var(--color-navy)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Documento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Agregado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}



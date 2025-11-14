/**
 * PolicyAffiliatesTable - Table display for affiliates under a policy
 */

import { useNavigate } from 'react-router-dom'

import type { PolicyAffiliateResponse } from '../../../../shared/types/policies'
import { TypeBadge } from '../../../affiliates/views/components/TypeBadge'
import { IsActiveBadge } from '../../../clients/views/components/IsActiveBadge'

interface PolicyAffiliatesTableProps {
  affiliates: PolicyAffiliateResponse[]
  loading?: boolean
}

const formatName = (firstName: string, lastName: string): string => `${firstName} ${lastName}`

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

export function PolicyAffiliatesTable({ affiliates, loading = false }: PolicyAffiliatesTableProps) {
  const navigate = useNavigate()

  const handleRowClick = (affiliateId: string) => {
    navigate(`/clientes/afiliados/${affiliateId}`)
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm overflow-hidden relative">
      {loading && <div className="absolute inset-0 bg-white/70 z-10 pointer-events-none" aria-hidden="true" />}

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <caption className="sr-only">Afiliados de la póliza</caption>
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
          <tbody className="divide-y divide-[var(--color-border)]" aria-busy={loading}>
            {affiliates.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                  No se encontraron afiliados para esta póliza
                </td>
              </tr>
            )}
            {affiliates.map((a) => (
              <tr key={a.id} onClick={() => handleRowClick(a.id)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm">
                  <span className="font-bold text-[var(--color-text-primary)]">{formatName(a.firstName, a.lastName)}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <TypeBadge type={a.affiliateType} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={a.email ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>
                    {a.email || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                  {a.documentNumber || '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <IsActiveBadge isActive={a.isActive} />
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{formatDate(a.addedAt)}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/clientes/afiliados/${a.id}`)
                    }}
                    className="text-[var(--color-teal)] hover:text-[var(--color-teal-dark)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] rounded px-2 py-1"
                    aria-label={`Ver detalles de ${formatName(a.firstName, a.lastName)}`}
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



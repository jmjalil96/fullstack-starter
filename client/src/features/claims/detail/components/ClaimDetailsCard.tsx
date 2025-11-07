/**
 * ClaimDetailsCard - Main details card showing all claim fields
 * Organized by sections with read-only display
 */

import { ReadOnlyField } from '../../../../shared/components/form/ReadOnlyField'
import type { ClaimDetailResponse } from '../../../../shared/types/claims'

/**
 * Props for ClaimDetailsCard component
 */
interface ClaimDetailsCardProps {
  /** Claim detail data */
  claim: ClaimDetailResponse
}

/**
 * Format currency value with locale support
 * Treats 0 as valid (not empty)
 */
const formatCurrency = (value: number | null, currency = 'USD'): string => {
  if (value === null) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value)
}

/**
 * Format ISO date string to localized date
 * Safe parser with NaN check
 */
const formatDate = (value: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * ClaimDetailsCard - Comprehensive claim details organized by sections
 *
 * Features:
 * - 6 logical sections (Información Básica, Partes, Montos, Póliza, Fechas)
 * - All fields in consistent positions
 * - Formatted values (currency, dates with locale)
 * - Responsive grid (2 columns desktop, stacks mobile)
 * - White card with section dividers
 *
 * @example
 * <ClaimDetailsCard claim={claim} />
 */
export function ClaimDetailsCard({ claim }: ClaimDetailsCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 space-y-8">
      {/* SECTION 1: INFORMACIÓN DEL RECLAMO */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Información del Reclamo
        </h3>
        {/* Description full-width */}
        <ReadOnlyField label="Descripción" value={claim.description} className="mb-4" />
        {/* 2-column grid for other fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField label="Tipo de Reclamo" value={claim.type} />
          <ReadOnlyField
            label="Fecha del Incidente"
            value={claim.incidentDate}
            formatter={(v) => formatDate(v as string | null)}
          />
          <ReadOnlyField
            label="Fecha de Envío"
            value={claim.submittedDate}
            formatter={(v) => formatDate(v as string | null)}
          />
          <ReadOnlyField
            label="Fecha de Resolución"
            value={claim.resolvedDate}
            formatter={(v) => formatDate(v as string | null)}
          />
        </div>
      </section>

      {/* SECTION 2: MONTOS Y PÓLIZA */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Montos y Póliza
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField
            label="Monto Reclamado"
            value={claim.amount}
            formatter={(v) => formatCurrency(v as number | null)}
          />
          <ReadOnlyField
            label="Monto Aprobado"
            value={claim.approvedAmount}
            formatter={(v) => formatCurrency(v as number | null)}
          />
          <ReadOnlyField
            label="Número de Póliza"
            value={claim.policyNumber}
            formatter={(v) => (v ? String(v) : 'Sin asignar')}
          />
        </div>
      </section>

      {/* SECTION 3: PARTES INVOLUCRADAS */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Partes Involucradas
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField label="Cliente" value={claim.clientName} />
          <ReadOnlyField
            label="Afiliado Titular"
            value={`${claim.affiliateFirstName} ${claim.affiliateLastName}`}
          />
          <ReadOnlyField
            label="Paciente"
            value={
              claim.patientFirstName && claim.patientLastName
                ? `${claim.patientFirstName} ${claim.patientLastName} (${claim.patientRelationship === 'self' ? 'titular' : 'dependiente'})`
                : '—'
            }
          />
        </div>
      </section>
    </div>
  )
}

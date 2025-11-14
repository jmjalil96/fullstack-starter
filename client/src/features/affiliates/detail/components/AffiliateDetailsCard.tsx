/**
 * AffiliateDetailsCard - Main details card showing all affiliate fields
 * Organized by sections with read-only display
 */

import { Link } from 'react-router-dom'

import { ReadOnlyField } from '../../../../shared/components/form/ReadOnlyField'
import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'

/**
 * Props for AffiliateDetailsCard component
 */
interface AffiliateDetailsCardProps {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse
}

/**
 * Format date string to Spanish locale format
 */
const formatDate = (value: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * AffiliateDetailsCard - Comprehensive affiliate details organized by sections
 *
 * Features:
 * - All fields in consistent positions
 * - Formatted values (dates with locale)
 * - Link to client detail page
 * - Responsive grid (2 columns desktop, stacks mobile)
 * - White card with consistent styling
 *
 * @example
 * <AffiliateDetailsCard affiliate={affiliate} />
 */
export function AffiliateDetailsCard({ affiliate }: AffiliateDetailsCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 space-y-8">
      {/* SECTION: INFORMACIÓN DEL AFILIADO */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Información del Afiliado
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Cliente (with link) */}
          <div>
            <div className="block text-sm font-medium text-[var(--color-navy)] mb-2">
              Cliente
            </div>
            <div className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
              <Link
                to={`/clientes/${affiliate.clientId}`}
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline"
              >
                {affiliate.clientName}
              </Link>
            </div>
          </div>

          <ReadOnlyField
            label="Email"
            value={affiliate.email}
            formatter={(v) => (v ? String(v) : '—')}
          />

          <ReadOnlyField
            label="Teléfono"
            value={affiliate.phone}
            formatter={(v) => (v ? String(v) : '—')}
          />

          <ReadOnlyField
            label="Fecha de Nacimiento"
            value={affiliate.dateOfBirth}
            formatter={(v) => formatDate(v as string | null)}
          />

          <ReadOnlyField
            label="Tipo de Documento"
            value={affiliate.documentType}
            formatter={(v) => (v ? String(v) : '—')}
          />

          <ReadOnlyField
            label="Número de Documento"
            value={affiliate.documentNumber}
            formatter={(v) => (v ? String(v) : '—')}
          />

          <ReadOnlyField
            label="Tipo de Cobertura"
            value={affiliate.coverageType}
            formatter={(v) => (v ? String(v) : '—')}
          />
        </div>
      </section>
    </div>
  )
}

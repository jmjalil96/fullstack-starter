/**
 * PolicyDetailsCard - Main details card showing all policy fields
 * Organized by sections with read-only display
 */

import { Link } from 'react-router-dom'

import { ReadOnlyField } from '../../../../shared/components/form/ReadOnlyField'
import { FIELD_LABELS } from '../../../../shared/constants/policyLifecycle'
import type { PolicyDetailResponse } from '../../../../shared/types/policies'

/**
 * Props for PolicyDetailsCard component
 */
interface PolicyDetailsCardProps {
  /** Policy detail data */
  policy: PolicyDetailResponse
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
 * Format percentage value
 * Treats copays as percentages (e.g., 35 → "35%")
 */
const formatPercentageValue = (value: number | null): string => {
  if (value === null) return '—'
  return `${value}%`
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
 * Format tax rate as percentage
 * Multiplies by 100 and shows % symbol
 */
const formatPercentage = (value: number | null): string => {
  if (value === null) return '—'
  return `${(value * 100).toFixed(2)}%`
}

/**
 * PolicyDetailsCard - Comprehensive policy details organized by sections
 *
 * Features:
 * - 5 logical sections (Información Básica, Periodo de Cobertura, Coberturas y Copagos, Primas, Costos)
 * - All 14 policy fields in consistent positions
 * - Formatted values (currency, dates, percentage with Spanish locale)
 * - Responsive grid (2 columns desktop, stacks mobile)
 * - White card with section dividers
 * - Client link to /clientes/:id
 *
 * @example
 * <PolicyDetailsCard policy={policy} />
 */
export function PolicyDetailsCard({ policy }: PolicyDetailsCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 space-y-8">
      {/* SECTION 1: INFORMACIÓN BÁSICA */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Información Básica
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField label={FIELD_LABELS.type} value={policy.type} />
          <ReadOnlyField label={FIELD_LABELS.policyNumber} value={policy.policyNumber} />
        </div>
      </section>

      {/* SECTION 2: PERIODO DE COBERTURA */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Periodo de Cobertura
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField
            label={FIELD_LABELS.startDate}
            value={policy.startDate}
            formatter={(v) => formatDate(v as string | null)}
          />
          <ReadOnlyField
            label={FIELD_LABELS.endDate}
            value={policy.endDate}
            formatter={(v) => formatDate(v as string | null)}
          />
        </div>
      </section>

      {/* SECTION 3: COBERTURAS Y COPAGOS */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Coberturas y Copagos
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField
            label={FIELD_LABELS.ambCopay}
            value={policy.ambCopay}
            formatter={(v) => formatPercentageValue(v as number | null)}
          />
          <ReadOnlyField
            label={FIELD_LABELS.hospCopay}
            value={policy.hospCopay}
            formatter={(v) => formatPercentageValue(v as number | null)}
          />
          <ReadOnlyField
            label={FIELD_LABELS.maternity}
            value={policy.maternity}
            formatter={(v) => formatCurrency(v as number | null)}
          />
        </div>
      </section>

      {/* SECTION 4: PRIMAS */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Primas
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField
            label={FIELD_LABELS.tPremium}
            value={policy.tPremium}
            formatter={(v) => formatCurrency(v as number | null)}
          />
          <ReadOnlyField
            label={FIELD_LABELS.tplus1Premium}
            value={policy.tplus1Premium}
            formatter={(v) => formatCurrency(v as number | null)}
          />
          <ReadOnlyField
            label={FIELD_LABELS.tplusfPremium}
            value={policy.tplusfPremium}
            formatter={(v) => formatCurrency(v as number | null)}
          />
        </div>
      </section>

      {/* SECTION 5: COSTOS */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Costos
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField
            label={FIELD_LABELS.taxRate}
            value={policy.taxRate}
            formatter={(v) => formatPercentage(v as number | null)}
          />
          <ReadOnlyField
            label={FIELD_LABELS.additionalCosts}
            value={policy.additionalCosts}
            formatter={(v) => formatCurrency(v as number | null)}
          />
        </div>
      </section>

      {/* SECTION 6: ENTIDADES RELACIONADAS */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Entidades Relacionadas
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Client - Custom field with link */}
          <div>
            <div className="block text-sm font-medium text-[var(--color-navy)] mb-2">
              {FIELD_LABELS.clientId}
            </div>
            <div className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
              <Link
                to={`/clientes/${policy.clientId}`}
                className="text-[var(--color-primary)] hover:underline"
              >
                {policy.clientName}
              </Link>
            </div>
          </div>

          {/* Insurer */}
          <ReadOnlyField label={FIELD_LABELS.insurerId} value={policy.insurerName} />
        </div>
      </section>
    </div>
  )
}

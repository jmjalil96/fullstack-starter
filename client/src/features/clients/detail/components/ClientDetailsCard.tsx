/**
 * ClientDetailsCard - Main details card showing all client fields
 * Organized by sections with read-only display
 */

import { ReadOnlyField } from '../../../../shared/components/form/ReadOnlyField'
import type { ClientDetailResponse } from '../../../../shared/types/clients'
import { IsActiveBadge } from '../../views/components/IsActiveBadge'

/**
 * Props for ClientDetailsCard component
 */
interface ClientDetailsCardProps {
  /** Client detail data */
  client: ClientDetailResponse
}

/**
 * ClientDetailsCard - Comprehensive client details organized by sections
 *
 * Features:
 * - 2 logical sections (Información General, Información de Contacto)
 * - All fields in consistent positions
 * - Formatted values (dates with locale)
 * - Responsive grid (2 columns desktop, stacks mobile)
 * - White card with section dividers
 *
 * @example
 * <ClientDetailsCard client={client} />
 */
export function ClientDetailsCard({ client }: ClientDetailsCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 space-y-8">
      {/* SECTION 1: INFORMACIÓN GENERAL */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Información General
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField label="Nombre" value={client.name} />
          <ReadOnlyField label="RNC/Cédula" value={client.taxId} />
          <div>
            <div className="block text-sm font-medium text-[var(--color-navy)] mb-2">
              Estado
            </div>
            <div className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
              <IsActiveBadge isActive={client.isActive} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INFORMACIÓN DE CONTACTO */}
      <section>
        <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
          Información de Contacto
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ReadOnlyField
            label="Correo Electrónico"
            value={client.email}
            formatter={(v) => (v ? String(v) : 'No especificado')}
          />
          <ReadOnlyField
            label="Teléfono"
            value={client.phone}
            formatter={(v) => (v ? String(v) : 'No especificado')}
          />
          <ReadOnlyField
            label="Dirección"
            value={client.address}
            formatter={(v) => (v ? String(v) : 'No especificado')}
            className="md:col-span-2"
          />
        </div>
      </section>
    </div>
  )
}

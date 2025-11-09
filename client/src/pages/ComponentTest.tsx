/**
 * ComponentTest - Test page for developing and previewing components in isolation
 */

import { useState } from 'react'

import { CreateClientModal } from '../features/clients/new/CreateClientModal'
import { ClientCard } from '../features/clients/views/components/ClientCard'
import { ClientsFilterBar } from '../features/clients/views/components/ClientsFilterBar'
import { ClientsPagination } from '../features/clients/views/components/ClientsPagination'
import { IsActiveBadge } from '../features/clients/views/components/IsActiveBadge'
import { Button } from '../shared/components/ui/Button'

/**
 * ComponentTest - Sandbox page for component development
 *
 * Use this page to develop and test components in isolation before
 * integrating them into actual features.
 */
export function ComponentTest() {
  const [filters, setFilters] = useState<{ isActive?: boolean; search?: string }>({})
  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-2">
          Component Test Page
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Sandbox for developing components in isolation
        </p>
      </div>

      {/* IsActiveBadge Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] border-b pb-2">
          IsActiveBadge
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-[var(--color-text-secondary)]">Active:</span>
            <IsActiveBadge isActive={true} />
          </div>

          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-[var(--color-text-secondary)]">Inactive:</span>
            <IsActiveBadge isActive={false} />
          </div>

          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-[var(--color-text-secondary)]">In sentence:</span>
            <p className="text-sm">
              Estado del cliente: <IsActiveBadge isActive={true} />
            </p>
          </div>
        </div>
      </section>

      {/* ClientsFilterBar Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] border-b pb-2">
          ClientsFilterBar
        </h2>

        <div className="space-y-4">
          <ClientsFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            loading={false}
          />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Filters:</p>
            <pre className="text-xs text-gray-600">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      {/* ClientsPagination Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] border-b pb-2">
          ClientsPagination
        </h2>

        <div className="space-y-4">
          <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
            <ClientsPagination
              pagination={{
                total: 47,
                page: page,
                limit: 20,
                totalPages: 3,
                hasMore: page < 3,
              }}
              onPageChange={setPage}
              loading={false}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Page: {page}</p>
          </div>
        </div>
      </section>

      {/* ClientCard Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] border-b pb-2">
          ClientCard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
          {/* Full data */}
          <ClientCard
            client={{
              id: '1',
              name: 'TechCorp S.A.',
              taxId: '20123456789',
              email: 'rrhh@techcorp.com',
              phone: '+51-1-5678901',
              address: 'Av. Javier Prado 123, San Isidro',
              isActive: true,
              createdAt: '2025-11-05T16:40:03.695Z',
            }}
            onClick={(id) => alert(`Navigate to client: ${id}`)}
          />

          {/* Minimal data (no contact) */}
          <ClientCard
            client={{
              id: '2',
              name: 'Comercial XYZ',
              taxId: '20345678901',
              email: null,
              phone: null,
              address: null,
              isActive: true,
              createdAt: '2025-10-15T10:00:00.000Z',
            }}
            onClick={(id) => alert(`Navigate to client: ${id}`)}
          />

          {/* Inactive client */}
          <ClientCard
            client={{
              id: '3',
              name: 'Industrias ABC (Inactiva)',
              taxId: '20234567890',
              email: 'admin@industriasabc.com',
              phone: '+51-1-6789012',
              address: null,
              isActive: false,
              createdAt: '2025-09-01T08:30:00.000Z',
            }}
            onClick={(id) => alert(`Navigate to client: ${id}`)}
          />
        </div>
      </section>

      {/* CreateClientModal Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] border-b pb-2">
          CreateClientModal
        </h2>

        <div className="space-y-4">
          <Button onClick={() => setCreateModalOpen(true)}>
            Abrir Modal de Creación
          </Button>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Click el botón para abrir el modal. Prueba la validación y creación de clientes.
            </p>
          </div>
        </div>
      </section>

      {/* Placeholder for next components */}
      <section className="space-y-4 opacity-50">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] border-b pb-2">
          More Components Coming Soon...
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add new components here as you build them
        </p>
      </section>

      {/* Modal */}
      <CreateClientModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          alert('Cliente creado exitosamente!')
        }}
      />
    </div>
  )
}

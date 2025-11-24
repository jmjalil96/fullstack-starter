import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import type { ClientListItemResponse } from '../../../features/clients/clients'
import { useClients } from '../../../features/clients/hooks/useClients'
import { DataTable, type Column } from '../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { ButtonDropdown } from '../../../shared/components/ui/interactive/ButtonDropdown'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'

import { CreateClientModal } from './CreateClientModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

const CLIENT_STATUS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

/**
 * Type guard to validate isActive filter value
 * Protects against invalid URL parameters
 */
function isValidActiveStatus(value: string): value is 'true' | 'false' {
  return value === 'true' || value === 'false'
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por nombre, RUC o email...' },
  {
    key: 'isActive',
    type: 'searchable-select',
    placeholder: 'Estado',
    options: CLIENT_STATUS,
  },
]

const COLUMNS: Column<ClientListItemResponse>[] = [
  { key: 'name', header: 'Cliente' },
  { key: 'taxId', header: 'RUC/DNI' },
  { key: 'email', header: 'Contacto' },
  {
    key: 'isActive',
    header: 'Estado',
    align: 'center',
    render: (client) => (
      <StatusBadge
        label={client.isActive ? 'Activo' : 'Inactivo'}
        color={client.isActive ? 'green' : 'gray'}
      />
    ),
  },
  {
    key: 'createdAt',
    header: 'Fecha Registro',
    align: 'right',
    render: (client) =>
      new Date(client.createdAt).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
  },
]

export function ClientsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)

  // Derive filters from URL on every render (URL is source of truth)
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    isActive: searchParams.get('isActive') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Helper: Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.isActive) params.set('isActive', next.isActive)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate and prepare isActive for API
  const validatedActive =
    filters.isActive && isValidActiveStatus(filters.isActive)
      ? filters.isActive === 'true'
      : undefined

  // Data Fetching (Smart Hook)
  const { data, isLoading } = useClients({
    search: filters.search || undefined,
    isActive: validatedActive,
    page: Math.max(DEFAULT_PAGE, Number(filters.page) || DEFAULT_PAGE),
    limit: Number(filters.limit) || DEFAULT_LIMIT,
  })

  // Handlers
  const handleFilterChange = (newFilters: Record<string, string>) => {
    applyFiltersToUrl({ ...filters, ...newFilters, page: String(DEFAULT_PAGE) })
  }

  const handlePageChange = (newPage: number) => {
    applyFiltersToUrl({ ...filters, page: String(newPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLimitChange = (newLimit: number) => {
    applyFiltersToUrl({ ...filters, limit: String(newLimit), page: String(DEFAULT_PAGE) })
  }

  const handleClear = () => {
    applyFiltersToUrl({
      search: '',
      isActive: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Cartera de Clientes"
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Clientes' }]}
        action={
          <ButtonDropdown
            label="Nuevo Cliente"
            mainAction={() => setCreateOpen(true)}
            items={[
              { label: 'Importar Clientes', onClick: () => console.warn('Import not implemented') },
              { label: 'Descargar Reporte', onClick: () => console.warn('Export not implemented') },
            ]}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          />
        }
      />

      {/* Filters */}
      <FilterBar
        config={FILTER_CONFIG}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      {/* Data Table */}
      <DataTable
        data={data?.clients || []}
        columns={COLUMNS}
        isLoading={isLoading}
        pagination={
          data?.pagination
            ? {
                ...data.pagination,
                onPageChange: handlePageChange,
                onLimitChange: handleLimitChange,
                currentLimit: Number(filters.limit),
              }
            : undefined
        }
        onRowClick={(client) => navigate(`/clientes/${client.id}`)}
        emptyMessage="No se encontraron clientes con estos filtros."
      />

      {/* Create Modal */}
      <CreateClientModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

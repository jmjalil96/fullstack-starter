import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable, type Column } from '../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../../shared/components/ui/forms/Button'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { useInsurers } from '../hooks/useInsurers'
import type { InsurerListItemResponse } from '../insurers'

import { CreateInsurerModal } from './CreateInsurerModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Type guard to validate isActive filter value
 */
function isValidActiveStatus(value: string): value is 'true' | 'false' {
  return value === 'true' || value === 'false'
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por nombre o código...' },
  {
    key: 'isActive',
    type: 'searchable-select',
    placeholder: 'Estado',
    options: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
  },
]

const COLUMNS: Column<InsurerListItemResponse>[] = [
  { key: 'name', header: 'Nombre' },
  {
    key: 'code',
    header: 'Código',
    render: (insurer) => insurer.code || '—',
  },
  {
    key: 'email',
    header: 'Email',
    render: (insurer) => insurer.email || '—',
  },
  {
    key: 'phone',
    header: 'Teléfono',
    render: (insurer) => insurer.phone || '—',
  },
  {
    key: 'isActive',
    header: 'Estado',
    align: 'center',
    render: (insurer) => (
      <StatusBadge
        label={insurer.isActive ? 'Activo' : 'Inactivo'}
        color={insurer.isActive ? 'green' : 'gray'}
      />
    ),
  },
]

export function InsurersList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createModalOpen, setCreateModalOpen] = useState(false)

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

  // Validate and prepare filters for API
  const validatedIsActive = filters.isActive && isValidActiveStatus(filters.isActive)
    ? filters.isActive === 'true'
    : undefined

  // Validate search length (backend requires min 1 char)
  const validatedSearch = filters.search && filters.search.trim().length >= 1
    ? filters.search
    : undefined

  // Data Fetching
  const { data, isLoading } = useInsurers({
    search: validatedSearch,
    isActive: validatedIsActive,
    page: Math.max(DEFAULT_PAGE, Number(filters.page) || DEFAULT_PAGE),
    limit: Math.max(1, Number(filters.limit) || DEFAULT_LIMIT),
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
        title="Aseguradoras"
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Aseguradoras' },
        ]}
        action={
          <Button onClick={() => setCreateModalOpen(true)}>
            Crear Aseguradora
          </Button>
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
        data={data?.insurers || []}
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
        onRowClick={(insurer) => navigate(`/admin/aseguradoras/${insurer.id}`)}
        emptyMessage="No se encontraron aseguradoras con estos filtros."
      />

      {/* Create Modal */}
      <CreateInsurerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  )
}

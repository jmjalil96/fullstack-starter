import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable, type Column } from '../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { ButtonDropdown } from '../../../shared/components/ui/interactive/ButtonDropdown'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { formatDate } from '../../../shared/utils/formatters'
import { usePolicies } from '../hooks/usePolicies'
import type { PolicyListItemResponse, PolicyStatus } from '../policies'
import { POLICY_LIFECYCLE } from '../policyLifecycle'

import { CreatePolicyModal } from './CreatePolicyModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Type guard to validate PolicyStatus at runtime
 * Protects against invalid URL parameters
 */
function isValidPolicyStatus(value: string): value is PolicyStatus {
  const validStatuses: PolicyStatus[] = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']
  return validStatuses.includes(value as PolicyStatus)
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por número, cliente o aseguradora...' },
  {
    key: 'status',
    type: 'searchable-select',
    placeholder: 'Estado',
    // Derive from lifecycle config (single source of truth)
    options: Object.entries(POLICY_LIFECYCLE).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  },
]

const COLUMNS: Column<PolicyListItemResponse>[] = [
  { key: 'policyNumber', header: 'Nº Póliza' },
  { key: 'clientName', header: 'Cliente' },
  { key: 'insurerName', header: 'Aseguradora' },
  { key: 'type', header: 'Tipo' },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    render: (policy) => {
      const statusConfig = POLICY_LIFECYCLE[policy.status]
      return <StatusBadge label={statusConfig.label} color={statusConfig.color} />
    },
  },
  {
    key: 'startDate',
    header: 'Vigencia',
    align: 'right',
    render: (policy) => formatDate(policy.startDate) || '—',
  },
]

export function PoliciesList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)

  // Derive filters from URL on every render (URL is source of truth)
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Helper: Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.status) params.set('status', next.status)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate and prepare status for API
  const validatedStatus =
    filters.status && isValidPolicyStatus(filters.status) ? filters.status : undefined

  // Data Fetching
  const { data, isLoading } = usePolicies({
    search: filters.search || undefined,
    status: validatedStatus,
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
      status: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Pólizas de Salud"
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Pólizas' },
        ]}
        action={
          <ButtonDropdown
            label="Nueva Póliza"
            mainAction={() => setCreateOpen(true)}
            items={[
              {
                label: 'Importar Pólizas',
                onClick: () => console.warn('Import not implemented'),
              },
              {
                label: 'Descargar Reporte',
                onClick: () => console.warn('Export not implemented'),
              },
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
        data={data?.policies || []}
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
        onRowClick={(policy) => navigate(`/polizas/${policy.id}`)}
        emptyMessage="No se encontraron pólizas con estos filtros."
      />

      {/* Create Modal */}
      <CreatePolicyModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

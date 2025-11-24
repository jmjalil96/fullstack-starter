import { useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable, type Column } from '../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../shared/components/ui/forms/Button'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'
import { CLAIM_LIFECYCLE } from '../../shared/constants/claimLifecycle'
import { useClaims } from '../../shared/hooks/claims/useClaims'
import type { ClaimListItemResponse, ClaimStatus } from '../../shared/types/claims'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Type guard to validate ClaimStatus at runtime
 * Protects against invalid URL parameters
 */
function isValidClaimStatus(value: string): value is ClaimStatus {
  const validStatuses: ClaimStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
  return validStatuses.includes(value as ClaimStatus)
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por número de reclamo...' },
  {
    key: 'status',
    type: 'searchable-select',
    placeholder: 'Estado',
    // Derive options from lifecycle config (single source of truth)
    options: Object.entries(CLAIM_LIFECYCLE).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  },
]

const COLUMNS: Column<ClaimListItemResponse>[] = [
  { key: 'claimNumber', header: 'Nº Reclamo' },
  { key: 'clientName', header: 'Cliente' },
  {
    key: 'affiliateFirstName',
    header: 'Afiliado',
    render: (claim) => `${claim.affiliateFirstName} ${claim.affiliateLastName}`,
  },
  {
    key: 'patientFirstName',
    header: 'Paciente',
    render: (claim) => `${claim.patientFirstName} ${claim.patientLastName}`,
  },
  {
    key: 'amount',
    header: 'Monto',
    align: 'right',
    render: (claim) =>
      claim.amount !== null
        ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(claim.amount)
        : '—',
  },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    render: (claim) => {
      const statusConfig = CLAIM_LIFECYCLE[claim.status]
      return <StatusBadge label={statusConfig.label} color={statusConfig.color} />
    },
  },
  {
    key: 'submittedDate',
    header: 'Fecha Envío',
    align: 'right',
    render: (claim) =>
      claim.submittedDate
        ? new Date(claim.submittedDate).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—',
  },
]

export function ClaimsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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
  const validatedStatus = filters.status && isValidClaimStatus(filters.status)
    ? filters.status
    : undefined

  // Data Fetching
  const { data, isLoading } = useClaims({
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
        title="Reclamos"
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Reclamos' },
        ]}
        action={
          <Button onClick={() => navigate('/reclamos/nuevo')}>Nuevo Reclamo</Button>
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
        data={data?.claims || []}
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
        onRowClick={(claim) => navigate(`/reclamos/${claim.id}`)}
        emptyMessage="No se encontraron reclamos con estos filtros."
      />
    </div>
  )
}

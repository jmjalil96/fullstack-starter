import { useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable, type Column } from '../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../../shared/components/ui/forms/Button'
import { ViewToggle } from '../../../shared/components/ui/forms/ViewToggle'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import { CLAIM_LIFECYCLE } from '../claimLifecycle'
import type { ClaimListItemResponse, ClaimStatus } from '../claims'
import { useClaims } from '../hooks/useClaims'

import { ClaimsKanban } from './ClaimsKanban'
import { ClaimsMobileList } from './ClaimsMobileList'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Type guard to validate ClaimStatus at runtime
 * Protects against invalid URL parameters
 */
function isValidClaimStatus(value: string): value is ClaimStatus {
  const validStatuses: ClaimStatus[] = [
    'DRAFT',
    'PENDING_INFO',
    'VALIDATION',
    'SUBMITTED',
    'RETURNED',
    'SETTLED',
    'CANCELLED',
  ]
  return validStatuses.includes(value as ClaimStatus)
}

// --- Configuration ---

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por reclamo, afiliado o paciente...' },
  {
    key: 'status',
    type: 'searchable-select',
    placeholder: 'Estado',
    options: Object.entries(CLAIM_LIFECYCLE).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  },
  {
    key: 'date',
    type: 'date-range',
    placeholder: 'Fecha',
    dateFieldOptions: [
      { value: 'submittedDate', label: 'Fecha Envío' },
      { value: 'createdAt', label: 'Fecha Creación' },
      { value: 'incidentDate', label: 'Fecha Incidente' },
      { value: 'settlementDate', label: 'Fecha Liquidación' },
    ],
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
    key: 'amountSubmitted',
    header: 'Monto',
    align: 'right',
    render: (claim) =>
      claim.amountSubmitted !== null
        ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
            claim.amountSubmitted
          )
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
  const isMobile = useMediaQuery('(max-width: 767px)')

  // View mode from URL (kanban is default)
  const viewMode = (searchParams.get('view') as 'list' | 'kanban') || 'kanban'

  // Derive filters from URL on every render (URL is source of truth)
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    dateField: searchParams.get('dateField') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Helper: Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    // Preserve view mode (don't include if kanban since it's default)
    if (viewMode === 'list') {
      params.set('view', 'list')
    }

    if (next.search) params.set('search', next.search)
    if (next.status) params.set('status', next.status)
    if (next.dateField) params.set('dateField', next.dateField)
    if (next.dateFrom) params.set('dateFrom', next.dateFrom)
    if (next.dateTo) params.set('dateTo', next.dateTo)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Toggle between list and kanban views
  const handleViewToggle = () => {
    const params = new URLSearchParams(searchParams)
    if (viewMode === 'kanban') {
      params.set('view', 'list')
    } else {
      params.delete('view') // kanban is default, clean URL
    }
    // Reset page when switching views
    params.delete('page')
    setSearchParams(params, { replace: true })
  }

  // Validate and prepare status for API
  const validatedStatus =
    filters.status && isValidClaimStatus(filters.status) ? filters.status : undefined

  // Data Fetching - only for desktop list view (not mobile, not kanban)
  const shouldFetchListData = !isMobile && viewMode === 'list'
  const { data, isLoading } = useClaims({
    search: filters.search || undefined,
    status: validatedStatus,
    dateField: filters.dateField || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: Math.max(DEFAULT_PAGE, Number(filters.page) || DEFAULT_PAGE),
    limit: Number(filters.limit) || DEFAULT_LIMIT,
    enabled: shouldFetchListData,
  })

  // Handlers
  const handleFilterChange = (next: Record<string, string>) => {
    applyFiltersToUrl({ ...next, page: String(DEFAULT_PAGE), limit: filters.limit })
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
      dateField: '',
      dateFrom: '',
      dateTo: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Reclamos"
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Reclamos' }]}
        action={
          <div className="flex items-center gap-3">
            {/* ViewToggle only on desktop - mobile has single card list view */}
            {!isMobile && <ViewToggle mode={viewMode} onToggle={handleViewToggle} />}
            <Button onClick={() => navigate('/reclamos/nuevo')}>Nuevo Reclamo</Button>
          </div>
        }
      />

      {/* Filters */}
      <FilterBar
        config={FILTER_CONFIG}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      {/* Conditional rendering based on screen size (prevents unnecessary API calls) */}
      {isMobile ? (
        <ClaimsMobileList
          search={filters.search || undefined}
          status={validatedStatus}
          dateField={filters.dateField || undefined}
          dateFrom={filters.dateFrom || undefined}
          dateTo={filters.dateTo || undefined}
        />
      ) : viewMode === 'kanban' ? (
        <ClaimsKanban
          search={filters.search || undefined}
          dateField={filters.dateField || undefined}
          dateFrom={filters.dateFrom || undefined}
          dateTo={filters.dateTo || undefined}
        />
      ) : (
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
      )}
    </div>
  )
}

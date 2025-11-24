import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import type {
  AffiliateListItemResponse,
  AffiliateType,
  CoverageType,
} from '../../../features/affiliates/affiliates'
import { useAffiliates } from '../../../features/affiliates/hooks/useAffiliates'
import { DataTable, type Column } from '../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { ButtonDropdown } from '../../../shared/components/ui/interactive/ButtonDropdown'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'

import { CreateAffiliateModal } from './CreateAffiliateModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Type guard to validate AffiliateType at runtime
 * Protects against invalid URL parameters
 */
function isValidAffiliateType(value: string): value is AffiliateType {
  const validTypes: AffiliateType[] = ['OWNER', 'DEPENDENT']
  return validTypes.includes(value as AffiliateType)
}

/**
 * Type guard to validate CoverageType at runtime
 * Protects against invalid URL parameters
 */
function isValidCoverageType(value: string): value is CoverageType {
  const validTypes: CoverageType[] = ['T', 'TPLUS1', 'TPLUSF']
  return validTypes.includes(value as CoverageType)
}

/**
 * Type guard to validate isActive filter value
 * Protects against invalid URL parameters
 */
function isValidActiveStatus(value: string): value is 'true' | 'false' {
  return value === 'true' || value === 'false'
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por nombre, documento o cliente...' },
  {
    key: 'affiliateType',
    type: 'searchable-select',
    placeholder: 'Tipo de afiliado',
    options: [
      { value: 'OWNER', label: 'Titular' },
      { value: 'DEPENDENT', label: 'Dependiente' },
    ],
  },
  {
    key: 'coverageType',
    type: 'searchable-select',
    placeholder: 'Cobertura',
    options: [
      { value: 'T', label: 'T - Titular' },
      { value: 'TPLUS1', label: 'TPLUS1 - Titular + 1' },
      { value: 'TPLUSF', label: 'TPLUSF - Titular + Familia' },
    ],
  },
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

const COLUMNS: Column<AffiliateListItemResponse>[] = [
  {
    key: 'name',
    header: 'Afiliado',
    render: (aff) => `${aff.firstName} ${aff.lastName}`,
  },
  { key: 'documentNumber', header: 'Documento' },
  { key: 'clientName', header: 'Cliente' },
  {
    key: 'affiliateType',
    header: 'Tipo',
    render: (aff) => (aff.affiliateType === 'OWNER' ? 'Titular' : 'Dependiente'),
  },
  {
    key: 'coverageType',
    header: 'Cobertura',
    render: (aff) => {
      if (!aff.coverageType) return '—'
      const map: Record<CoverageType, string> = {
        T: 'T',
        TPLUS1: 'T+1',
        TPLUSF: 'T+F',
      }
      return map[aff.coverageType]
    },
  },
  {
    key: 'hasUserAccount',
    header: 'Usuario',
    align: 'center',
    render: (aff) => (
      <StatusBadge
        label={aff.hasUserAccount ? 'Sí' : 'No'}
        color={aff.hasUserAccount ? 'blue' : 'gray'}
      />
    ),
  },
  {
    key: 'isActive',
    header: 'Estado',
    align: 'center',
    render: (aff) => (
      <StatusBadge
        label={aff.isActive ? 'Activo' : 'Inactivo'}
        color={aff.isActive ? 'green' : 'gray'}
      />
    ),
  },
  {
    key: 'createdAt',
    header: 'Fecha Registro',
    align: 'right',
    render: (aff) =>
      new Date(aff.createdAt).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
  },
]

export function AffiliatesList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)

  // Derive filters from URL on every render (URL is source of truth)
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    affiliateType: searchParams.get('affiliateType') || '',
    coverageType: searchParams.get('coverageType') || '',
    isActive: searchParams.get('isActive') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Helper: Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.affiliateType) params.set('affiliateType', next.affiliateType)
    if (next.coverageType) params.set('coverageType', next.coverageType)
    if (next.isActive) params.set('isActive', next.isActive)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate and prepare filters for API
  const validatedAffiliateType = filters.affiliateType && isValidAffiliateType(filters.affiliateType)
    ? filters.affiliateType
    : undefined

  const validatedCoverageType = filters.coverageType && isValidCoverageType(filters.coverageType)
    ? filters.coverageType
    : undefined

  const validatedIsActive = filters.isActive && isValidActiveStatus(filters.isActive)
    ? filters.isActive === 'true'
    : undefined

  // Validate search length (backend requires min 2 chars)
  const validatedSearch = filters.search && filters.search.trim().length >= 2
    ? filters.search
    : undefined

  // Data Fetching
  const { data, isLoading } = useAffiliates({
    search: validatedSearch,
    affiliateType: validatedAffiliateType,
    coverageType: validatedCoverageType,
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
      affiliateType: '',
      coverageType: '',
      isActive: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Afiliados"
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Afiliados' },
        ]}
        action={
          <ButtonDropdown
            label="Nuevo Afiliado"
            mainAction={() => setCreateOpen(true)}
            items={[
              { label: 'Importar Afiliados', onClick: () => console.warn('Import not implemented') },
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
        data={data?.affiliates || []}
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
        onRowClick={(aff) => navigate(`/afiliados/${aff.id}`)}
        emptyMessage="No se encontraron afiliados con estos filtros."
      />

      {/* Create Modal */}
      <CreateAffiliateModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

/**
 * PoliciesListView - Main view for policies list with filtering and pagination
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetPolicies, type PolicyStatus } from '../../../shared/hooks/policies'

import {
  PoliciesFilterBar,
  PoliciesPagination,
  PoliciesTable,
  PoliciesTableSkeleton,
} from './components'

/**
 * PoliciesListView - Orchestrates policies list display
 *
 * Features:
 * - Filter bar with search, status, clientId, and insurerId filters
 * - Paginated policies table
 * - URL params for shareable links (?status=X&clientId=Y&insurerId=Z&search=W&page=P)
 * - Loading states (keeps data visible during fetch)
 * - Error handling
 * - Click policy row → navigate to detail page
 * - Auto-scrolls to top on page change
 *
 * @example
 * // In Policies page
 * <PoliciesListView />
 */
export function PoliciesListView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Initialize state from URL params on mount
  const [filters, setFilters] = useState<{
    status?: PolicyStatus
    clientId?: string
    insurerId?: string
    search?: string
  }>(() => ({
    status: (searchParams.get('status') as PolicyStatus) || undefined,
    clientId: searchParams.get('clientId') || undefined,
    insurerId: searchParams.get('insurerId') || undefined,
    search: searchParams.get('search') || undefined,
  }))

  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page')
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1
    return parsedPage >= 1 ? parsedPage : 1
  })

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.status) {
      params.set('status', filters.status)
    }
    if (filters.clientId) {
      params.set('clientId', filters.clientId)
    }
    if (filters.insurerId) {
      params.set('insurerId', filters.insurerId)
    }
    if (filters.search) {
      params.set('search', filters.search)
    }
    if (page > 1) {
      params.set('page', page.toString())
    }

    setSearchParams(params, { replace: true }) // Replace to avoid polluting history
  }, [filters, page, setSearchParams])

  // Fetch policies with current filters and page
  const { policies, pagination, loading, error } = useGetPolicies({
    ...filters,
    page,
  })

  // Delayed loading indicator (200ms delay, 300ms min display)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!loading) {
      // When loading ends, keep spinner visible for min 300ms
      const timer = setTimeout(() => setShowLoading(false), 300)
      return () => clearTimeout(timer)
    }

    // When loading starts, only show spinner after 200ms delay
    const timer = setTimeout(() => setShowLoading(true), 200)
    return () => clearTimeout(timer)
  }, [loading])

  /**
   * Handle filter changes - reset page only if filters actually changed
   */
  const handleFiltersChange = (newFilters: typeof filters) => {
    const filtersChanged =
      newFilters.status !== filters.status ||
      newFilters.clientId !== filters.clientId ||
      newFilters.insurerId !== filters.insurerId ||
      newFilters.search !== filters.search

    setFilters(newFilters)

    // Only reset page if filters changed (avoid re-fetch on same filters)
    if (filtersChanged) {
      setPage(1)
    }
  }

  /**
   * Handle page change - scroll to top for better UX
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * Handle policy row click - navigate to detail page
   */
  const handlePolicyClick = (policyId: string) => {
    navigate(`/clientes/polizas/${policyId}`)
  }

  /**
   * Handle create button click - navigate to new policy page
   */
  const handleCreateClick = () => {
    navigate('/clientes/polizas/nueva')
  }

  // Initial load - show skeleton
  if (loading && policies.length === 0 && !error) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">Pólizas</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Gestión de pólizas de seguro
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateClick}
            className="flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Crear Póliza</span>
          </Button>
        </div>

        {/* Skeleton Table */}
        <PoliciesTableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">Pólizas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestión de pólizas de seguro
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreateClick}
          className="flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Crear Póliza</span>
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <PoliciesFilterBar filters={filters} onFiltersChange={handleFiltersChange} loading={loading} />

      {/* Policies Table */}
      <PoliciesTable policies={policies} loading={loading} onPolicyClick={handlePolicyClick} />

      {/* Subtle corner loading indicator (delayed) */}
      {showLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-full shadow-lg p-3">
            <Spinner size="sm" />
          </div>
        </div>
      )}

      {/* Pagination (hidden if error or <=1 page) - gated on pagination to prevent flash */}
      {!error && pagination && (
        <PoliciesPagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
      )}
    </div>
  )
}

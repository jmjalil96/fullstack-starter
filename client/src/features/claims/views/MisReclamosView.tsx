/**
 * MisReclamosView - Main view for claims list with filtering and pagination
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetClaims, type ClaimStatus } from '../../../shared/hooks/claims'

import { ClaimsFilterBar, ClaimsPagination, ClaimsTable } from './components'

/**
 * MisReclamosView - Orchestrates claims list display
 *
 * Features:
 * - Filter bar with search and status filter
 * - Paginated claims table
 * - URL params for shareable links (?status=X&search=Y&page=Z)
 * - Loading states (keeps data visible during fetch)
 * - Error handling
 * - Click claim → navigate to detail page
 * - Auto-scrolls to top on page change
 *
 * @example
 * // In MisReclamos page
 * <MisReclamosView />
 */
export function MisReclamosView() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize state from URL params on mount
  const [filters, setFilters] = useState<{ status?: ClaimStatus; search?: string }>(() => ({
    status: (searchParams.get('status') as ClaimStatus) || undefined,
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
    if (filters.search) {
      params.set('search', filters.search)
    }
    if (page > 1) {
      params.set('page', page.toString())
    }

    setSearchParams(params, { replace: true }) // Replace to avoid polluting history
  }, [filters, page, setSearchParams])

  // Fetch claims with current filters and page
  const { claims, pagination, loading, error } = useGetClaims({
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
    const filtersChanged = newFilters.status !== filters.status || newFilters.search !== filters.search

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

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <ClaimsFilterBar filters={filters} onFiltersChange={handleFiltersChange} loading={loading} />

      {/* Claims Table (with overlay during loading) */}
      <ClaimsTable claims={claims} loading={loading} />

      {/* Subtle corner loading indicator (delayed) */}
      {showLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-full shadow-lg p-3">
            <Spinner size="sm" />
          </div>
        </div>
      )}

      {/* Pagination (hidden if error or <=1 page) */}
      {!error && pagination && (
        <ClaimsPagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
      )}
    </div>
  )
}

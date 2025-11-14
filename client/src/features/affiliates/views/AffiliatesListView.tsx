/**
 * AffiliatesListView - Main view for affiliates list with filtering and pagination
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetAffiliates } from '../../../shared/hooks/affiliates/useGetAffiliates'
import { CreateAffiliateModal } from '../new/CreateAffiliateModal'

import {
  AffiliatesFilterBar,
  AffiliatesPagination,
  AffiliatesTable,
  AffiliatesTableSkeleton,
} from './components'

/**
 * AffiliatesListView - Orchestrates affiliates list display
 *
 * Features:
 * - Filter bar with search, affiliateType, and isActive filters
 * - Paginated affiliates table
 * - URL params for shareable links (?affiliateType=X&isActive=Y&search=Z&page=P)
 * - Loading states (keeps data visible during fetch)
 * - Error handling
 * - Auto-scrolls to top on page change
 *
 * @example
 * // In Affiliates page
 * <AffiliatesListView />
 */
export function AffiliatesListView() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Initialize state from URL params on mount
  const [filters, setFilters] = useState<{
    affiliateType?: 'OWNER' | 'DEPENDENT'
    isActive?: boolean
    search?: string
  }>(() => ({
    affiliateType: (searchParams.get('affiliateType') as 'OWNER' | 'DEPENDENT') || undefined,
    isActive:
      searchParams.get('isActive') === 'true'
        ? true
        : searchParams.get('isActive') === 'false'
          ? false
          : undefined,
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

    if (filters.affiliateType) {
      params.set('affiliateType', filters.affiliateType)
    }
    if (filters.isActive !== undefined) {
      params.set('isActive', filters.isActive.toString())
    }
    if (filters.search) {
      params.set('search', filters.search)
    }
    if (page > 1) {
      params.set('page', page.toString())
    }

    setSearchParams(params, { replace: true }) // Replace to avoid polluting history
  }, [filters, page, setSearchParams])

  // Fetch affiliates with current filters and page
  const { affiliates, pagination, loading, error, refetch } = useGetAffiliates({
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
  const handleFiltersChange = (newFilters: {
    search: string
    affiliateType: 'OWNER' | 'DEPENDENT' | ''
    isActive: boolean | undefined
  }) => {
    // Convert FilterBar format to internal state format
    const convertedFilters = {
      search: newFilters.search || undefined,
      affiliateType: (newFilters.affiliateType || undefined) as 'OWNER' | 'DEPENDENT' | undefined,
      isActive: newFilters.isActive
    }

    const filtersChanged =
      convertedFilters.affiliateType !== filters.affiliateType ||
      convertedFilters.isActive !== filters.isActive ||
      convertedFilters.search !== filters.search

    setFilters(convertedFilters)

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
   * Handle modal success - refetch list to show new affiliate
   */
  const handleCreateSuccess = () => {
    setCreateModalOpen(false)
    refetch() // Refresh list to show new affiliate
  }

  // Initial load - show skeleton
  if (loading && affiliates.length === 0 && !error) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">Afiliados</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Gestión de afiliados
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
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
            <span className="hidden sm:inline">Crear Afiliado</span>
          </Button>
        </div>

        {/* Skeleton Table */}
        <AffiliatesTableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">Afiliados</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestión de afiliados
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
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
          <span className="hidden sm:inline">Crear Afiliado</span>
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <AffiliatesFilterBar
        filters={{
          search: filters.search || '',
          affiliateType: (filters.affiliateType as 'OWNER' | 'DEPENDENT' | '') || '',
          isActive: filters.isActive
        }}
        onFilterChange={handleFiltersChange}
        onReset={() => {
          setFilters({ search: '', affiliateType: undefined, isActive: undefined })
          setPage(1)
        }}
      />

      {/* Affiliates Table */}
      <AffiliatesTable affiliates={affiliates} loading={loading} />

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
        <AffiliatesPagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
      )}

      {/* Create Affiliate Modal */}
      <CreateAffiliateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

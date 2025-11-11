/**
 * ClientsListView - Main view for clients list with filtering and pagination
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetClients } from '../../../shared/hooks/clients/useGetClients'
import { CreateClientModal } from '../new/CreateClientModal'

import { ClientCard, ClientCardSkeleton, ClientsFilterBar, ClientsPagination } from './components'

/**
 * ClientsListView - Orchestrates clients list display
 *
 * Features:
 * - Filter bar with search and isActive filter
 * - Paginated clients cards
 * - URL params for shareable links (?isActive=X&search=Y&page=Z)
 * - Loading states (keeps data visible during fetch)
 * - Error handling
 * - Click client card → navigate to detail page
 * - Auto-scrolls to top on page change
 *
 * @example
 * // In Clientes page
 * <ClientsListView />
 */
export function ClientsListView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Initialize state from URL params on mount
  const [filters, setFilters] = useState<{ isActive?: boolean; search?: string }>(() => ({
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

  // Fetch clients with current filters and page
  const { clients, pagination, loading, error, refetch } = useGetClients({
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
    const filtersChanged = newFilters.isActive !== filters.isActive || newFilters.search !== filters.search

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
   * Handle client card click - navigate to detail page
   */
  const handleClientClick = (clientId: string) => {
    navigate(`/clientes/${clientId}`)
  }

  /**
   * Handle modal success - refetch list to show new client
   */
  const handleCreateSuccess = () => {
    setCreateModalOpen(false)
    refetch() // Refresh list to show new client
  }

  // Initial load - show skeleton cards
  if (loading && clients.length === 0 && !error) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">Clientes</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Gestión de empresas clientes
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
            <span className="hidden sm:inline">Crear Cliente</span>
          </Button>
        </div>

        {/* Skeleton Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">Clientes</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestión de empresas clientes
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
          <span className="hidden sm:inline">Crear Cliente</span>
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <ClientsFilterBar filters={filters} onFiltersChange={handleFiltersChange} loading={loading} />

      {/* Clients Grid (with overlay during loading) */}
      <div className="relative">
        {loading && (
          <div
            className="absolute inset-0 bg-white/70 z-10 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Empty state */}
        {!loading && pagination && clients.length === 0 && !error && (
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[var(--color-text-light)] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-[var(--color-text-secondary)]">No se encontraron clientes</p>
          </div>
        )}

        {/* Clients Cards Grid */}
        {clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} onClick={handleClientClick} />
            ))}
          </div>
        )}
      </div>

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
        <ClientsPagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
      )}

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

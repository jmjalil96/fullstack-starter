/**
 * ClaimsMobileList - Mobile-optimized card list view for claims
 *
 * Displays claims as cards with infinite scroll pagination.
 * Used on mobile devices (< md breakpoint) instead of Kanban/DataTable views.
 */

import { useInfiniteScroll } from '../../../shared/hooks/useInfiniteScroll'
import type { ClaimStatus } from '../claims'
import { flattenClaimsPages, getColumnTotal, useMobileClaimsList } from '../hooks/useClaimsKanban'

import { ClaimCard } from './ClaimCard'

// ============================================================================
// TYPES
// ============================================================================

interface ClaimsMobileListProps {
  /** Optional client filter */
  clientId?: string
  /** Optional search term */
  search?: string
  /** Optional status filter */
  status?: ClaimStatus
  /** Date field to filter by */
  dateField?: string
  /** Start date (ISO) */
  dateFrom?: string
  /** End date (ISO) */
  dateTo?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClaimsMobileList({
  clientId,
  search,
  status,
  dateField,
  dateFrom,
  dateTo,
}: ClaimsMobileListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMobileClaimsList({
    clientId,
    search,
    status,
    dateField,
    dateFrom,
    dateTo,
  })

  const allClaims = flattenClaimsPages(data)
  // Deduplicate claims by ID (can happen during pagination race conditions)
  const claims = allClaims.filter(
    (claim, index, self) => self.findIndex((c) => c.id === claim.id) === index
  )
  const total = getColumnTotal(data)
  const isEmpty = !isLoading && claims.length === 0

  const sentinelRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  })

  return (
    <div className="space-y-3">
      {/* Results count */}
      {!isLoading && !isEmpty && (
        <p className="text-sm text-gray-500 px-1">
          {total} reclamo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && <EmptyState />}

      {/* Claims list */}
      {!isLoading && !isEmpty && (
        <div className="space-y-3">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Cargando más...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// LOADING CARD
// ============================================================================

function LoadingCard() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>
      <div className="h-px bg-gray-100 mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 bg-gray-100 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-600 mb-1">Sin reclamos</p>
      <p className="text-sm text-gray-400">No se encontraron reclamos con estos filtros.</p>
    </div>
  )
}

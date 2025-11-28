/**
 * useClaimsKanban - Infinite query hooks for Kanban view
 *
 * Provides per-column infinite scroll queries that fetch claims
 * filtered by status with pagination support.
 */

import { useInfiniteQuery } from '@tanstack/react-query'

import type { ClaimStatus, GetClaimsResponse } from '../claims'
import { getClaims } from '../claimsApi'

import { CLAIMS_KEYS } from './useClaims'

/** Number of items per page for kanban columns */
const KANBAN_PAGE_SIZE = 12

/** Number of items per page for mobile list (larger since it's a single list) */
const MOBILE_PAGE_SIZE = 20

// ============================================================================
// HOOK
// ============================================================================

interface UseKanbanColumnParams {
  /** Status to filter by */
  status: ClaimStatus
  /** Optional client filter */
  clientId?: string
  /** Optional search term */
  search?: string
  /** Date field to filter by */
  dateField?: string
  /** Start date (ISO) */
  dateFrom?: string
  /** End date (ISO) */
  dateTo?: string
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Infinite query hook for a single Kanban column
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useKanbanColumn({
 *   status: 'SUBMITTED',
 *   clientId: filters.clientId,
 * })
 */
export function useKanbanColumn({
  status,
  clientId,
  search,
  dateField,
  dateFrom,
  dateTo,
  enabled = true,
}: UseKanbanColumnParams) {
  return useInfiniteQuery({
    // Include filters in query key for proper cache separation
    queryKey: [...CLAIMS_KEYS.kanbanColumn(status), { clientId, search, dateField, dateFrom, dateTo }],

    queryFn: ({ pageParam, signal }) =>
      getClaims(
        {
          status,
          clientId,
          search,
          dateField,
          dateFrom,
          dateTo,
          page: pageParam,
          limit: KANBAN_PAGE_SIZE,
        },
        { signal }
      ),

    initialPageParam: 1,

    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,

    // Consistent with existing useClaims pattern
    staleTime: 1000 * 60 * 5, // 5 minutes

    // Prevent refetch while user is scrolling
    refetchOnWindowFocus: false,

    enabled,
  })
}

// ============================================================================
// MOBILE LIST HOOK
// ============================================================================

interface UseMobileClaimsListParams {
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
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Infinite query hook for mobile card list view
 *
 * Similar to useKanbanColumn but without status grouping - fetches all claims
 * with infinite scroll pagination.
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMobileClaimsList({
 *   search: 'john',
 *   clientId: 'abc123',
 * })
 */
export function useMobileClaimsList({
  clientId,
  search,
  status,
  dateField,
  dateFrom,
  dateTo,
  enabled = true,
}: UseMobileClaimsListParams = {}) {
  return useInfiniteQuery({
    queryKey: CLAIMS_KEYS.mobileListParams({ clientId, search, status, dateField, dateFrom, dateTo }),

    queryFn: ({ pageParam, signal }) =>
      getClaims(
        {
          clientId,
          search,
          status,
          dateField,
          dateFrom,
          dateTo,
          page: pageParam,
          limit: MOBILE_PAGE_SIZE,
        },
        { signal }
      ),

    initialPageParam: 1,

    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled,
  })
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Flatten infinite query pages into a single array of claims
 *
 * @example
 * const claims = flattenClaimsPages(data)
 * // Returns all claims from all loaded pages
 */
export function flattenClaimsPages(
  data: { pages: GetClaimsResponse[] } | undefined
) {
  if (!data) return []
  return data.pages.flatMap((page) => page.claims)
}

/**
 * Get total count from first page pagination
 *
 * @example
 * const total = getColumnTotal(data)
 * // Returns total claims matching the filter
 */
export function getColumnTotal(
  data: { pages: GetClaimsResponse[] } | undefined
): number {
  if (!data?.pages[0]) return 0
  return data.pages[0].pagination.total
}

/**
 * Common shared types used across multiple modules
 */

/**
 * Pagination metadata returned by all paginated API endpoints
 *
 * Standard structure for pagination information:
 *
 * @property total - Total number of items matching filters
 * @property page - Current page number (1-indexed)
 * @property limit - Items per page
 * @property totalPages - Total number of pages
 * @property hasMore - Whether there are more pages after current page
 *
 * @example
 * ```typescript
 * const response: { data: Item[], pagination: PaginationMetadata } = await getItems()
 * console.log(`Showing ${response.pagination.page} of ${response.pagination.totalPages} pages`)
 * ```
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

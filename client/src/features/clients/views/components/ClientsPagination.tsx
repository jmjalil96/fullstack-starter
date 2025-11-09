/**
 * ClientsPagination - Pagination controls for clients list
 */

/**
 * Pagination metadata interface (mirrors backend)
 */
interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Props for ClientsPagination component
 */
interface ClientsPaginationProps {
  /** Pagination metadata from API */
  pagination: PaginationMetadata
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Loading state (disables controls) */
  loading?: boolean
}

/**
 * Generate array of page numbers with smart truncation
 *
 * @param currentPage - Current active page
 * @param totalPages - Total number of pages
 * @returns Array of page numbers and ellipsis tokens
 *
 * @example
 * generatePageNumbers(1, 5) // [1, 2, 3, 4, 5]
 * generatePageNumbers(5, 10) // [1, '...', 4, 5, 6, '...', 10]
 */
function generatePageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  // Show all pages if 7 or fewer
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  // Smart truncation for 8+ pages
  if (currentPage <= 3) {
    // Near start: [1, 2, 3, 4, '...', totalPages]
    return [1, 2, 3, 4, '...', totalPages]
  }

  if (currentPage >= totalPages - 2) {
    // Near end: [1, '...', totalPages-3, totalPages-2, totalPages-1, totalPages]
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  // Middle: [1, '...', currentPage-1, currentPage, currentPage+1, '...', totalPages]
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

/**
 * ClientsPagination - Page navigation controls
 *
 * Features:
 * - Previous/Next buttons with icons
 * - Smart page number truncation (shows relevant pages)
 * - Info text (Mostrando X-Y de Z)
 * - Disabled during loading
 * - Auto-hides when only 1 page
 * - Full accessibility
 *
 * @example
 * const [page, setPage] = useState(1)
 *
 * <ClientsPagination
 *   pagination={pagination}
 *   onPageChange={setPage}
 *   loading={loading}
 * />
 */
export function ClientsPagination({
  pagination,
  onPageChange,
  loading = false,
}: ClientsPaginationProps) {
  const { total, page, limit, totalPages, hasMore } = pagination

  // Hide pagination if only 1 page or no results
  if (totalPages <= 1) {
    return null
  }

  // Calculate display range
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  // Generate page numbers with smart truncation
  const pageNumbers = generatePageNumbers(page, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-[var(--color-border)] bg-white">
      {/* Info Text */}
      <div className="text-sm text-[var(--color-text-secondary)]">
        Mostrando {start}-{end} de {total}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
          aria-disabled={page === 1 || loading}
          aria-label="Página anterior"
          className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-navy)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
        >
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </span>
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((pageNum, index) =>
          pageNum === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-sm text-[var(--color-text-secondary)]"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              aria-disabled={loading}
              aria-current={pageNum === page ? 'page' : undefined}
              aria-label={`Ir a página ${pageNum}`}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] ${
                pageNum === page
                  ? 'bg-[var(--color-teal)] border-[var(--color-teal)] text-white'
                  : 'bg-white border-[var(--color-border)] text-[var(--color-navy)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
              }`}
            >
              {pageNum}
              {pageNum === page && <span className="sr-only"> (actual)</span>}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore || loading}
          aria-disabled={!hasMore || loading}
          aria-label="Página siguiente"
          className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-navy)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
        >
          <span className="flex items-center gap-1">
            Siguiente
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}

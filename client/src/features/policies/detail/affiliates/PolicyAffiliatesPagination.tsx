/**
 * PolicyAffiliatesPagination - Pagination controls for policy affiliates list
 */

import type { PaginationMetadata } from '../../../../shared/types/policies'

interface PolicyAffiliatesPaginationProps {
  pagination: PaginationMetadata
  onPageChange: (page: number) => void
  loading?: boolean
}

function generatePageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages]
  if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

export function PolicyAffiliatesPagination({
  pagination,
  onPageChange,
  loading = false,
}: PolicyAffiliatesPaginationProps) {
  const { total, page, limit, totalPages, hasMore } = pagination
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pageNumbers = generatePageNumbers(page, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-[var(--color-border)] bg-white">
      <div className="text-sm text-[var(--color-text-secondary)]">
        Mostrando {start}-{end} de {total} afiliados
      </div>
      <div className="flex items-center gap-1">
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
        {pageNumbers.map((pageNum, index) =>
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-[var(--color-text-secondary)]" aria-hidden="true">
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



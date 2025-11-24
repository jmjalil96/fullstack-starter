import type { ReactNode } from 'react'

import type { PaginationMetadata } from '../../../types/common'
import { Button } from '../forms/Button'

/**
 * Column definition for DataTable
 */
export interface Column<T> {
  /** Unique key for the column (usually the property name) */
  key: string
  /** Header label to display */
  header: string
  /** Optional custom render function */
  render?: (item: T) => ReactNode
  /** Width class (e.g., 'w-24', 'flex-1') - defaults to auto */
  width?: string
  /** Alignment (left, center, right) - defaults to left */
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  /** Array of data items to display */
  data: T[]
  /** Column configuration */
  columns: Column<T>[]
  /** Loading state (shows skeleton) */
  isLoading?: boolean
  /** Pagination configuration and handlers */
  pagination?: PaginationMetadata & {
    onPageChange: (page: number) => void
    onLimitChange?: (limit: number) => void
    currentLimit?: number
  }
  /** Callback when row is clicked */
  onRowClick?: (item: T) => void
  /** Message to show when table is empty */
  emptyMessage?: string
  /** Optional table caption for accessibility (defaults to "Data table") */
  caption?: string
}

/**
 * DataTable - A robust, glassmorphism data table
 *
 * Features:
 * - Generic data support with type safety
 * - Built-in pagination UI
 * - Loading skeletons
 * - Empty state handling
 * - Clickable rows (optional)
 * - Glass morphism styling
 * - Fully accessible
 *
 * @example
 * const columns: Column<User>[] = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email', align: 'right' },
 *   { key: 'status', header: 'Status', render: (user) => <Badge>{user.status}</Badge> }
 * ]
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   isLoading={isLoading}
 *   pagination={paginationData}
 *   onRowClick={(user) => navigate(`/users/${user.id}`)}
 * />
 */
export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  pagination,
  onRowClick,
  emptyMessage = 'No se encontraron resultados',
  caption = 'Data table',
}: DataTableProps<T>) {
  // --- Loading State (Skeleton) ---
  if (isLoading) {
    const skeletonRows = pagination?.limit || 10

    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200/50 rounded-xl" />
        {[...Array(skeletonRows)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100/50 rounded-xl" />
        ))}
      </div>
    )
  }

  // Helper: Get alignment class
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center'
    if (align === 'right') return 'text-right'
    return 'text-left'
  }

  return (
    <div className="space-y-4">
      {/* --- Table Container --- */}
      <div className="w-full overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative group">
        {/* Gradient Border Overlay (Simulates light reflection) */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/50 pointer-events-none opacity-50"
          style={{ maskImage: 'linear-gradient(to bottom right, black, transparent 70%)' }}
        ></div>

        {/* Scrollable Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left relative z-10 min-w-[600px] md:min-w-0">
            {/* Accessibility: Table Caption */}
            <caption className="sr-only">{caption}</caption>

            {/* Header */}
            <thead className="bg-gradient-to-r from-[var(--color-navy)]/90 to-[var(--color-navy)]/80 backdrop-blur-md border-b border-white/10 text-xs uppercase text-white font-bold tracking-wider shadow-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-6 py-4 ${col.width || ''} ${getAlignClass(col.align)}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-200/60">
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick?.(item)}
                    className={`
                      group transition-all duration-200
                      ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white/20'}
                      ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-gold)]/5 hover:shadow-sm hover:scale-[1.002]' : ''}
                    `}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${item.id}-${col.key}`}
                        className={`px-6 py-4 whitespace-nowrap ${getAlignClass(col.align)} text-gray-600 group-hover:text-[var(--color-navy)] transition-colors`}
                      >
                        {col.render
                          ? col.render(item)
                          : (item as Record<string, unknown>)[col.key] as ReactNode}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg
                        className="w-8 h-8 opacity-20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p>{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Pagination Controls --- */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 py-3">
          {/* Page Info - Compact on Mobile */}
          <p className="text-xs text-gray-400 text-center sm:text-left w-full sm:w-auto">
            <span className="sm:hidden font-medium text-gray-600">
              {pagination.page}/{pagination.totalPages}
            </span>
            <span className="hidden sm:inline">
              Mostrando página <span className="font-medium text-gray-600">{pagination.page}</span> de{' '}
              <span className="font-medium text-gray-600">{pagination.totalPages}</span>
            </span>
          </p>

          {/* Page Size Selector - Hidden on Mobile */}
          {pagination.onLimitChange && (
            <div className="hidden sm:flex items-center gap-2">
              <label htmlFor="page-size-select" className="text-xs text-gray-500">
                Mostrar
              </label>
              <select
                id="page-size-select"
                value={pagination.currentLimit || 10}
                onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]/50 cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-xs text-gray-500">por página</span>
            </div>
          )}

          {/* Navigation - Icons on Mobile, Text on Desktop */}
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

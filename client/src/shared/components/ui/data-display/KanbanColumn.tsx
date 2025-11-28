/**
 * KanbanColumn - Generic column for Kanban boards
 *
 * Vertical column with sticky header, scrollable content area,
 * and built-in infinite scroll support.
 *
 * @example
 * <KanbanColumn
 *   header={<ColumnHeader title="To Do" count={5} />}
 *   isLoading={isLoading}
 *   isFetchingMore={isFetchingNextPage}
 *   hasMore={hasNextPage}
 *   onLoadMore={fetchNextPage}
 *   emptyState={<EmptyState />}
 * >
 *   {items.map(item => <KanbanCard key={item.id} />)}
 * </KanbanColumn>
 */

import { Children, type ReactNode } from 'react'

import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll'
import { Spinner } from '../feedback/Spinner'

interface KanbanColumnProps {
  /** Column header content (status label, count badge, etc.) */
  header: ReactNode
  /** Cards to display in the column */
  children: ReactNode
  /** Show loading skeleton on initial load */
  isLoading?: boolean
  /** Show spinner when fetching more items */
  isFetchingMore?: boolean
  /** Whether there are more items to load */
  hasMore?: boolean
  /** Callback to load more items */
  onLoadMore?: () => void
  /** Content to show when column is empty */
  emptyState?: ReactNode
  /** Custom loading skeleton (defaults to built-in skeleton) */
  loadingSkeleton?: ReactNode
}

/** Default loading skeleton for initial load */
function DefaultSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white/50 rounded-xl p-3"
          style={{ opacity: 1 - i * 0.15 }}
        >
          <div className="h-3 bg-gray-200/60 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-200/60 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200/60 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function KanbanColumn({
  header,
  children,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
  emptyState,
  loadingSkeleton,
}: KanbanColumnProps) {
  const sentinelRef = useInfiniteScroll({
    onLoadMore: onLoadMore ?? (() => {}),
    hasNextPage: hasMore,
    isFetchingNextPage: isFetchingMore,
  })

  const childCount = Children.count(children)
  const isEmpty = !isLoading && childCount === 0

  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-white/30 bg-white/50">
        {header}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300/50 scrollbar-track-transparent">
        {isLoading ? (
          loadingSkeleton ?? <DefaultSkeleton />
        ) : isEmpty ? (
          emptyState
        ) : (
          children
        )}

        {/* Sentinel for infinite scroll */}
        {!isLoading && !isEmpty && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

        {/* Loading more indicator */}
        {isFetchingMore && (
          <div className="flex justify-center py-3">
            <Spinner size="sm" label="Cargando más..." />
          </div>
        )}
      </div>
    </div>
  )
}

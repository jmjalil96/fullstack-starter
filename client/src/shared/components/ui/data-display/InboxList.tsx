import type { ReactNode } from 'react'

import type { PaginationMetadata } from '../../../types/common'
import { Button } from '../forms/Button'

import type { BadgeColor } from './StatusBadge'
import { StatusBadge } from './StatusBadge'

/**
 * Badge configuration for inbox items
 */
export interface InboxBadge {
  label: string
  color: BadgeColor
}

/**
 * Rendered item configuration returned by renderItem
 */
export interface InboxItemRendered {
  /** Unique identifier */
  id: string
  /** Main title (e.g., ticket number + subject) */
  title: string
  /** Preview text (e.g., last message) */
  preview: string
  /** Timestamp display (e.g., "hace 2h") */
  timestamp: string
  /** Status/priority badges */
  badges?: InboxBadge[]
  /** Additional metadata (e.g., "Capstone • 3 mensajes") */
  meta?: string
  /** Whether item has unread content */
  isUnread?: boolean
}

interface InboxListProps<T> {
  /** Array of data items to display */
  items: T[]
  /** Function to transform item to renderable format */
  renderItem: (item: T) => InboxItemRendered
  /** Loading state (shows skeleton) */
  isLoading?: boolean
  /** Callback when item is clicked */
  onItemClick?: (item: T) => void
  /** Message to show when list is empty */
  emptyMessage?: string
  /** Icon for empty state */
  emptyIcon?: ReactNode
  /** Pagination configuration and handlers */
  pagination?: PaginationMetadata & {
    onPageChange: (page: number) => void
    onLimitChange?: (limit: number) => void
    currentLimit?: number
  }
}

/**
 * InboxList - Email/Slack-style list component
 *
 * Features:
 * - Inbox-style item layout with title, preview, badges
 * - Unread indicator (blue dot)
 * - Glass morphism styling (consistent with DataTable)
 * - Loading skeletons
 * - Empty state handling
 * - Built-in pagination
 * - Fully accessible
 *
 * @example
 * <InboxList
 *   items={tickets}
 *   renderItem={(ticket) => ({
 *     id: ticket.id,
 *     title: `${ticket.ticketNumber} - ${ticket.subject}`,
 *     preview: ticket.lastMessage || 'Sin mensajes',
 *     timestamp: formatRelative(ticket.updatedAt),
 *     badges: [
 *       { label: 'Abierto', color: 'blue' },
 *       { label: 'Alta', color: 'orange' }
 *     ],
 *     meta: `${ticket.clientName} • ${ticket.messageCount} mensajes`,
 *     isUnread: ticket.hasUnread
 *   })}
 *   onItemClick={(ticket) => navigate(`/casos/${ticket.id}`)}
 *   pagination={paginationData}
 * />
 */
export function InboxList<T extends { id: string | number }>({
  items,
  renderItem,
  isLoading = false,
  onItemClick,
  emptyMessage = 'No se encontraron resultados',
  emptyIcon,
  pagination,
}: InboxListProps<T>) {
  // --- Loading State (Skeleton) ---
  if (isLoading) {
    const skeletonRows = pagination?.limit || 10

    return (
      <div className="w-full space-y-3 animate-pulse">
        {[...Array(skeletonRows)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/60 backdrop-blur-xl border border-white/20 p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="h-5 bg-gray-200/70 rounded-lg w-2/3" />
              <div className="h-4 bg-gray-200/50 rounded w-16" />
            </div>
            <div className="h-4 bg-gray-100/70 rounded w-full mb-2" />
            <div className="flex gap-2">
              <div className="h-5 bg-gray-100/50 rounded-full w-16" />
              <div className="h-5 bg-gray-100/50 rounded-full w-14" />
              <div className="h-4 bg-gray-100/30 rounded w-32 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // --- Empty State ---
  if (items.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-12">
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
          {emptyIcon || (
            <svg
              className="w-12 h-12 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* --- Items List --- */}
      <div className="space-y-2">
        {items.map((item) => {
          const rendered = renderItem(item)

          const handleKeyDown = (e: React.KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && onItemClick) {
              e.preventDefault()
              onItemClick(item)
            }
          }

          return (
            <div
              key={rendered.id}
              role={onItemClick ? 'button' : undefined}
              tabIndex={onItemClick ? 0 : undefined}
              onClick={() => onItemClick?.(item)}
              onKeyDown={onItemClick ? handleKeyDown : undefined}
              className={`
                group relative rounded-xl bg-white/60 backdrop-blur-xl backdrop-saturate-150
                border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.03)]
                transition-all duration-200 overflow-hidden
                ${onItemClick ? 'cursor-pointer hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:scale-[1.002] hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}
              `}
            >
              {/* Gradient Border Overlay */}
              <div
                className="absolute inset-0 rounded-xl border border-white/50 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"
                style={{ maskImage: 'linear-gradient(to bottom right, black, transparent 70%)' }}
              />

              <div className="relative z-10 p-4">
                {/* Row 1: Title + Timestamp */}
                <div className="flex justify-between items-start gap-4 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Unread Indicator */}
                    {rendered.isUnread && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    )}
                    <h3
                      className={`text-sm truncate ${
                        rendered.isUnread
                          ? 'font-semibold text-[var(--color-navy)]'
                          : 'font-medium text-gray-700 group-hover:text-[var(--color-navy)]'
                      } transition-colors`}
                    >
                      {rendered.title}
                    </h3>
                  </div>
                  <span className="flex-shrink-0 text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
                    {rendered.timestamp}
                  </span>
                </div>

                {/* Row 2: Preview */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-2 group-hover:text-gray-600 transition-colors">
                  {rendered.preview}
                </p>

                {/* Row 3: Badges + Meta */}
                <div className="flex items-center justify-between gap-2">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rendered.badges?.map((badge, idx) => (
                      <StatusBadge key={idx} label={badge.label} color={badge.color} size="sm" />
                    ))}
                  </div>

                  {/* Meta */}
                  {rendered.meta && (
                    <span className="text-xs text-gray-400 truncate">{rendered.meta}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* --- Pagination Controls --- */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 py-3">
          {/* Page Info */}
          <p className="text-xs text-gray-400 text-center sm:text-left w-full sm:w-auto">
            <span className="sm:hidden font-medium text-gray-600">
              {pagination.page}/{pagination.totalPages}
            </span>
            <span className="hidden sm:inline">
              Mostrando página <span className="font-medium text-gray-600">{pagination.page}</span> de{' '}
              <span className="font-medium text-gray-600">{pagination.totalPages}</span>
            </span>
          </p>

          {/* Page Size Selector */}
          {pagination.onLimitChange && (
            <div className="hidden sm:flex items-center gap-2">
              <label htmlFor="inbox-page-size" className="text-xs text-gray-500">
                Mostrar
              </label>
              <select
                id="inbox-page-size"
                value={pagination.currentLimit || 10}
                onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white/60 focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]/50 cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="text-xs text-gray-500">por página</span>
            </div>
          )}

          {/* Navigation */}
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

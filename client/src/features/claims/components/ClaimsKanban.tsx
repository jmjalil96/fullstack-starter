/**
 * ClaimsKanban - Claims-specific Kanban board view
 *
 * Uses generic KanbanBoard/Column/Card components with claims data.
 * Displays all 7 workflow statuses as columns.
 */

import type React from 'react'

import { KanbanBoard, KanbanColumn } from '../../../shared/components/ui'
import { CLAIM_LIFECYCLE } from '../claimLifecycle'
import type { ClaimStatus } from '../claims'
import { flattenClaimsPages, getColumnTotal, useKanbanColumn } from '../hooks/useClaimsKanban'

import { ClaimCard } from './ClaimCard'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Order of columns in the Kanban board (all 7 workflow statuses) */
const KANBAN_STATUSES: ClaimStatus[] = [
  'DRAFT',
  'VALIDATION',
  'SUBMITTED',
  'PENDING_INFO',
  'RETURNED',
  'SETTLED',
  'CANCELLED',
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ClaimsKanbanProps {
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
}

export function ClaimsKanban({ clientId, search, dateField, dateFrom, dateTo }: ClaimsKanbanProps) {
  return (
    <KanbanBoard columnWidth={320} className="pb-6">
      {KANBAN_STATUSES.map((status) => (
        <ClaimsKanbanColumn
          key={status}
          status={status}
          clientId={clientId}
          search={search}
          dateField={dateField}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      ))}
    </KanbanBoard>
  )
}

// ============================================================================
// COLUMN COMPONENT
// ============================================================================

interface ClaimsKanbanColumnProps {
  status: ClaimStatus
  clientId?: string
  search?: string
  dateField?: string
  dateFrom?: string
  dateTo?: string
}

function ClaimsKanbanColumn({ status, clientId, search, dateField, dateFrom, dateTo }: ClaimsKanbanColumnProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useKanbanColumn({ status, clientId, search, dateField, dateFrom, dateTo })

  const claims = flattenClaimsPages(data)
  const total = getColumnTotal(data)
  const config = CLAIM_LIFECYCLE[status]

  return (
    <KanbanColumn
      header={<ColumnHeader label={config.label} color={config.color} count={total} />}
      isLoading={isLoading}
      isFetchingMore={isFetchingNextPage}
      hasMore={hasNextPage}
      onLoadMore={fetchNextPage}
      emptyState={<EmptyColumnState status={status} />}
    >
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </KanbanColumn>
  )
}

// ============================================================================
// COLUMN HEADER
// ============================================================================

interface ColumnHeaderProps {
  label: string
  color: string
  count: number
}

function ColumnHeader({ label, color, count }: ColumnHeaderProps) {
  // Map lifecycle color to Tailwind classes (aligned with ClaimCard borders)
  const colorStyles: Record<string, { dot: string; badge: string }> = {
    gray: { dot: 'bg-gray-500', badge: 'bg-gray-50 text-gray-700 ring-gray-600/20' },
    amber: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    navy: { dot: 'bg-[#336f8f]', badge: 'bg-blue-50 text-blue-800 ring-blue-600/20' },
    orange: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
    red: { dot: 'bg-red-600', badge: 'bg-red-50 text-red-700 ring-red-600/20' },
    teal: { dot: 'bg-[#008c7e]', badge: 'bg-teal-50 text-teal-700 ring-teal-600/20' },
  }
  const style = colorStyles[color] ?? { dot: 'bg-gray-500', badge: 'bg-gray-50 text-gray-600 ring-gray-500/10' }

  return (
    <div className="flex items-center justify-between py-1 mb-2 px-1">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ring-2 ring-white ${style.dot}`} />
        <span className="text-sm font-bold text-gray-900 tracking-tight">
          {label}
        </span>
      </div>
      <span className={`
        inline-flex items-center justify-center
        min-w-[1.5rem] h-6 px-2
        text-xs font-medium rounded-full
        ring-1 ring-inset
        ${style.badge}
      `}>
        {count}
      </span>
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyColumnStateProps {
  status: ClaimStatus
}

function EmptyColumnState({ status }: EmptyColumnStateProps) {
  // Icon colors aligned with column headers and card borders
  const configs: Record<ClaimStatus, { title: string; subtitle: string; icon: React.ReactNode }> = {
    DRAFT: {
      title: 'Sin borradores',
      subtitle: 'No hay reclamos en preparación',
      icon: (
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    VALIDATION: {
      title: 'Nada en validación',
      subtitle: 'Todo está al día',
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    SUBMITTED: {
      title: 'Sin envíos',
      subtitle: 'No hay reclamos enviados',
      icon: (
        <svg className="w-6 h-6 text-[#336f8f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    PENDING_INFO: {
      title: 'Sin pendientes',
      subtitle: 'No hay reclamos esperando información',
      icon: (
        <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    RETURNED: {
      title: 'Sin devoluciones',
      subtitle: 'No hay reclamos devueltos',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    },
    SETTLED: {
      title: 'Sin liquidaciones',
      subtitle: 'Aún no hay reclamos liquidados',
      icon: (
        <svg className="w-6 h-6 text-[#008c7e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    CANCELLED: {
      title: 'Sin cancelaciones',
      subtitle: 'No hay reclamos cancelados',
      icon: (
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }
  const config = configs[status]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50 mx-2">
      <div className="w-12 h-12 mb-3 rounded-full bg-white flex items-center justify-center shadow-sm">
        {config.icon}
      </div>
      <p className="text-sm font-semibold text-gray-500">{config.title}</p>
      <p className="text-xs text-gray-400 mt-1">{config.subtitle}</p>
    </div>
  )
}

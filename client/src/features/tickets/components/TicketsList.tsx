import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { FilterBar, type FilterConfig } from '../../../shared/components/ui/data-display/FilterBar'
import { InboxList } from '../../../shared/components/ui/data-display/InboxList'
import { Button } from '../../../shared/components/ui/forms/Button'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { useTickets } from '../hooks/useTickets'
import {
  isValidTicketPriority,
  isValidTicketStatus,
  TICKET_PRIORITY_CONFIG,
  TICKET_STATUS_CONFIG,
} from '../ticketLifecycle'
import type { TicketListItemResponse } from '../tickets'

import { CreateTicketModal } from './CreateTicketModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

// --- Filter Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por número o asunto...' },
  {
    key: 'status',
    type: 'searchable-select',
    placeholder: 'Estado',
    options: Object.entries(TICKET_STATUS_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  },
  {
    key: 'priority',
    type: 'searchable-select',
    placeholder: 'Prioridad',
    options: Object.entries(TICKET_PRIORITY_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  },
]

/**
 * Format date to relative time string
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffHour < 24) return `hace ${diffHour}h`
  if (diffDay < 7) return `hace ${diffDay}d`

  return date.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
  })
}

/**
 * TicketsList - Inbox-style list of support tickets ("Mis Casos")
 */
export function TicketsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)

  // Derive filters from URL on every render (URL is source of truth)
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Helper: Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.status) params.set('status', next.status)
    if (next.priority) params.set('priority', next.priority)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate status and priority for API
  const validatedStatus =
    filters.status && isValidTicketStatus(filters.status) ? filters.status : undefined
  const validatedPriority =
    filters.priority && isValidTicketPriority(filters.priority) ? filters.priority : undefined

  // Data Fetching
  const { data, isLoading } = useTickets({
    search: filters.search || undefined,
    status: validatedStatus,
    priority: validatedPriority,
    page: Math.max(DEFAULT_PAGE, Number(filters.page) || DEFAULT_PAGE),
    limit: Number(filters.limit) || DEFAULT_LIMIT,
  })

  // Handlers
  const handleFilterChange = (newFilters: Record<string, string>) => {
    applyFiltersToUrl({ ...filters, ...newFilters, page: String(DEFAULT_PAGE) })
  }

  const handlePageChange = (newPage: number) => {
    applyFiltersToUrl({ ...filters, page: String(newPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLimitChange = (newLimit: number) => {
    applyFiltersToUrl({ ...filters, limit: String(newLimit), page: String(DEFAULT_PAGE) })
  }

  const handleClear = () => {
    applyFiltersToUrl({
      search: '',
      status: '',
      priority: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  // Transform ticket to inbox item format
  const renderTicketItem = (ticket: TicketListItemResponse) => {
    const statusConfig = TICKET_STATUS_CONFIG[ticket.status]
    const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority]

    // Build preview with category
    const preview = ticket.category
      ? `Categoría: ${ticket.category}`
      : 'Sin categoría'

    // Build meta with people info
    const assignee = ticket.assignedToName || 'Sin asignar'
    const reporter = ticket.reporterName || ticket.createdByName

    return {
      id: ticket.id,
      title: `${ticket.ticketNumber} — ${ticket.subject}`,
      preview,
      timestamp: formatRelativeTime(ticket.updatedAt),
      badges: [
        { label: statusConfig.label, color: statusConfig.color },
        { label: priorityConfig.label, color: priorityConfig.color },
      ],
      meta: `${ticket.clientName} • Asignado: ${assignee} • Por: ${reporter} • ${ticket.messageCount} msg`,
      isUnread: false,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Mis Casos"
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Mis Casos' }]}
        action={<Button onClick={() => setCreateOpen(true)}>Nuevo Caso</Button>}
      />

      {/* Filters */}
      <FilterBar
        config={FILTER_CONFIG}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      {/* Inbox List */}
      <InboxList
        items={data?.tickets || []}
        renderItem={renderTicketItem}
        isLoading={isLoading}
        onItemClick={(ticket) => navigate(`/casos/${ticket.id}`)}
        emptyMessage="No se encontraron casos con estos filtros."
        emptyIcon={
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
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        }
        pagination={
          data?.pagination
            ? {
                ...data.pagination,
                onPageChange: handlePageChange,
                onLimitChange: handleLimitChange,
                currentLimit: Number(filters.limit),
              }
            : undefined
        }
      />

      {/* Create Modal */}
      <CreateTicketModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

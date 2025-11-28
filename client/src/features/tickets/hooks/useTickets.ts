/**
 * React Query hooks for tickets data fetching
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type {
  AvailableClientResponse,
  GetTicketsResponse,
  TicketDetailResponse,
  TicketPriority,
  TicketStatus,
} from '../tickets'
import { getAvailableClients, getTicketById, getTickets } from '../ticketsApi'

/**
 * Query key factory for tickets
 * Hierarchical structure enables granular cache invalidation
 */
export const TICKETS_KEYS = {
  all: ['tickets-v1'] as const,
  lists: () => [...TICKETS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...TICKETS_KEYS.lists(), params] as const,
  details: () => [...TICKETS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TICKETS_KEYS.details(), id] as const,
  availableClients: () => [...TICKETS_KEYS.all, 'available-clients'] as const,
}

/**
 * Parameters for useTickets hook
 */
export interface UseTicketsParams {
  status?: TicketStatus
  priority?: TicketPriority
  clientId?: string
  assignedToId?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * Fetch paginated tickets list with filters
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Query result with tickets and pagination
 *
 * @example
 * const { data, isLoading } = useTickets({ status: 'OPEN', page: 1 })
 */
export function useTickets(params: UseTicketsParams = {}) {
  return useQuery<GetTicketsResponse>({
    queryKey: TICKETS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getTickets(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch single ticket detail by ID
 *
 * @param ticketId - Ticket ID to fetch
 * @returns Query result with ticket detail
 *
 * @example
 * const { data, isLoading } = useTicketDetail('ticket-123')
 */
export function useTicketDetail(ticketId: string) {
  return useQuery<TicketDetailResponse>({
    queryKey: TICKETS_KEYS.detail(ticketId),
    queryFn: ({ signal }) => getTicketById(ticketId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!ticketId,
  })
}

/**
 * Fetch available clients for ticket creation
 *
 * Returns clients based on user's role:
 * - BROKER_EMPLOYEES: All active clients
 * - CLIENT_ADMIN: Their accessible clients
 * - AFFILIATE: Only their single client
 *
 * @returns Query result with available clients
 *
 * @example
 * const { data: clients, isLoading } = useAvailableTicketClients()
 */
export function useAvailableTicketClients() {
  return useQuery<AvailableClientResponse[]>({
    queryKey: TICKETS_KEYS.availableClients(),
    queryFn: ({ signal }) => getAvailableClients({ signal }),
    staleTime: 1000 * 60 * 10, // 10 minutes - clients don't change often
  })
}

/**
 * Tickets API service layer
 * Type-safe wrappers around fetchAPI for tickets endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  AddTicketMessageRequest,
  AddTicketMessageResponse,
  AssignTicketRequest,
  AssignTicketResponse,
  AvailableClientResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  GetTicketsResponse,
  TicketDetailResponse,
  TicketPriority,
  TicketStatus,
  TicketUpdateRequest,
  TicketUpdateResponse,
} from './tickets'

/**
 * Get paginated list of tickets with optional filters
 *
 * Returns tickets based on user's role and permissions.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated tickets list with metadata
 *
 * @example
 * const response = await getTickets()
 * // Returns: { tickets: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * const response = await getTickets({ status: 'OPEN', priority: 'HIGH' })
 */
export async function getTickets(
  params?: {
    status?: TicketStatus
    priority?: TicketPriority
    clientId?: string
    assignedToId?: string
    category?: string
    search?: string
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetTicketsResponse> {
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.append('status', params.status)
  }
  if (params?.priority) {
    searchParams.append('priority', params.priority)
  }
  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.assignedToId) {
    searchParams.append('assignedToId', params.assignedToId)
  }
  if (params?.category) {
    searchParams.append('category', params.category)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/tickets${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetTicketsResponse>(endpoint, options)
}

/**
 * Get complete ticket detail by ID
 *
 * @param ticketId - Ticket ID to fetch
 * @param options - Optional RequestInit options
 * @returns Complete ticket with all fields and messages
 *
 * @example
 * const ticket = await getTicketById('ticket-123')
 */
export async function getTicketById(
  ticketId: string,
  options?: RequestInit
): Promise<TicketDetailResponse> {
  return fetchAPI<TicketDetailResponse>(`/api/tickets/${ticketId}`, options)
}

/**
 * Create a new ticket
 *
 * @param data - Ticket data (subject, message, priority, category, etc.)
 * @returns Created ticket with ticket number and details
 *
 * @example
 * const ticket = await createTicket({
 *   subject: 'Problema con factura',
 *   message: 'No puedo ver el detalle de mi factura',
 *   priority: 'HIGH'
 * })
 */
export async function createTicket(data: CreateTicketRequest): Promise<CreateTicketResponse> {
  return fetchAPI<CreateTicketResponse>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update a ticket (broker employees only)
 *
 * @param ticketId - Ticket ID to update
 * @param updates - Partial ticket updates
 * @returns Updated ticket
 *
 * @example
 * const updated = await updateTicket('ticket-123', { status: 'IN_PROGRESS' })
 */
export async function updateTicket(
  ticketId: string,
  updates: TicketUpdateRequest,
  options?: RequestInit
): Promise<TicketUpdateResponse> {
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<TicketUpdateResponse>(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}

/**
 * Assign a ticket to an employee (broker employees only)
 *
 * @param ticketId - Ticket ID to assign
 * @param data - Assignment data (assignedToId or null to unassign)
 * @returns Updated assignment info
 *
 * @example
 * const result = await assignTicket('ticket-123', { assignedToId: 'user-456' })
 *
 * @example
 * // Unassign
 * const result = await assignTicket('ticket-123', { assignedToId: null })
 */
export async function assignTicket(
  ticketId: string,
  data: AssignTicketRequest,
  options?: RequestInit
): Promise<AssignTicketResponse> {
  return fetchAPI<AssignTicketResponse>(`/api/tickets/${ticketId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Add a message to a ticket
 *
 * @param ticketId - Ticket ID to add message to
 * @param data - Message content
 * @returns Created message
 *
 * @example
 * const message = await addTicketMessage('ticket-123', { message: 'Here is more info...' })
 */
export async function addTicketMessage(
  ticketId: string,
  data: AddTicketMessageRequest,
  options?: RequestInit
): Promise<AddTicketMessageResponse> {
  return fetchAPI<AddTicketMessageResponse>(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Get available clients for ticket creation
 *
 * Returns clients based on user's role:
 * - BROKER_EMPLOYEES: All active clients
 * - CLIENT_ADMIN: Their accessible clients
 * - AFFILIATE: Only their single client
 *
 * @param options - Optional RequestInit options
 * @returns Array of available clients
 *
 * @example
 * const clients = await getAvailableClients()
 */
export async function getAvailableClients(
  options?: RequestInit
): Promise<AvailableClientResponse[]> {
  return fetchAPI<AvailableClientResponse[]>('/api/tickets/available-clients', options)
}

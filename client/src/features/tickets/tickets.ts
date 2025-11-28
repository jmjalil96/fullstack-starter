/**
 * Tickets type definitions
 * Mirrors backend DTOs from api/src/features/tickets/
 */

import type { PaginationMetadata } from '../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

/**
 * Ticket status enum values
 * Mirrors backend: api/prisma/schema.prisma TicketStatus
 */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED'

/**
 * Ticket priority enum values
 * Mirrors backend: api/prisma/schema.prisma TicketPriority
 */
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

/**
 * Available client for ticket creation dropdown
 * Returned from GET /api/tickets/available-clients
 */
export interface AvailableClientResponse {
  id: string
  name: string
}

/**
 * Single ticket item in list view
 * Lightweight summary with flat structure
 * Returned from GET /api/tickets
 */
export interface TicketListItemResponse {
  id: string
  ticketNumber: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category: string | null
  clientId: string
  clientName: string
  reporterId: string | null
  reporterName: string | null
  createdById: string
  createdByName: string
  assignedToId: string | null
  assignedToName: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Response from GET /api/tickets
 * Returns paginated list of tickets with metadata
 */
export interface GetTicketsResponse {
  tickets: TicketListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Ticket message in detail view
 */
export interface TicketMessageResponse {
  id: string
  message: string
  authorId: string
  authorName: string
  createdAt: string
}

/**
 * Complete ticket detail with all fields and messages
 * Returned from GET /api/tickets/:id
 */
export interface TicketDetailResponse {
  id: string
  ticketNumber: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category: string | null
  clientId: string
  clientName: string
  relatedClaimId: string | null
  relatedClaimNumber: string | null
  reporterId: string | null
  reporterName: string | null
  createdById: string
  createdByName: string
  assignedToId: string | null
  assignedToName: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  messages: TicketMessageResponse[]
}

/**
 * Create ticket request body
 * Sent to POST /api/tickets
 */
export interface CreateTicketRequest {
  subject: string
  message: string
  priority?: TicketPriority
  category?: string
  clientId?: string // Only needed for CLIENT_ADMIN with multiple clients
  reporterId?: string // For broker employees creating on behalf of
  relatedClaimId?: string
}

/**
 * Create ticket response
 * Returned from POST /api/tickets
 */
export interface CreateTicketResponse {
  id: string
  ticketNumber: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category: string | null
  clientId: string
  clientName: string
  createdAt: string
}

/**
 * Update ticket request body
 * Sent to PATCH /api/tickets/:id
 */
export interface TicketUpdateRequest {
  status?: TicketStatus
  priority?: TicketPriority
  category?: string | null
}

/**
 * Update ticket response
 * Returned from PATCH /api/tickets/:id
 */
export interface TicketUpdateResponse {
  id: string
  ticketNumber: string
  subject: string
  status: string
  priority: string
  category: string | null
  clientId: string
  clientName: string
  assignedToId: string | null
  assignedToName: string | null
  closedAt: string | null
  updatedAt: string
}

/**
 * Assign ticket request body
 * Sent to PATCH /api/tickets/:id/assign
 */
export interface AssignTicketRequest {
  assignedToId: string | null
}

/**
 * Assign ticket response
 * Returned from PATCH /api/tickets/:id/assign
 */
export interface AssignTicketResponse {
  id: string
  ticketNumber: string
  assignedToId: string | null
  assignedToName: string | null
  updatedAt: string
}

/**
 * Add message request body
 * Sent to POST /api/tickets/:id/messages
 */
export interface AddTicketMessageRequest {
  message: string
}

/**
 * Add message response
 * Returned from POST /api/tickets/:id/messages
 */
export interface AddTicketMessageResponse {
  id: string
  message: string
  authorId: string
  authorName: string
  ticketId: string
  ticketNumber: string
  createdAt: string
}

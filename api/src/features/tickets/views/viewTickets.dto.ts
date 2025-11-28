/**
 * DTOs for viewing/listing tickets
 */

import { TicketPriority, TicketStatus } from '@prisma/client'

/**
 * Query parameters for GET /api/tickets
 */
export interface GetTicketsQueryParams {
  /** Filter by ticket status */
  status?: TicketStatus
  /** Filter by ticket priority */
  priority?: TicketPriority
  /** Filter by client (broker employees can filter any, others restricted) */
  clientId?: string
  /** Filter by assigned employee (broker employees only) */
  assignedToId?: string
  /** Filter by category */
  category?: string
  /** Search by ticket number (case-insensitive, exact match) */
  search?: string
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single ticket item in list view
 * Lightweight summary with flat structure (no nested objects)
 */
export interface TicketListItemResponse {
  // Core identification
  id: string
  ticketNumber: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category: string | null

  // Client info (flat)
  clientId: string
  clientName: string

  // Reporter info (flat)
  reporterId: string | null
  reporterName: string | null

  // Creator info (flat)
  createdById: string
  createdByName: string

  // Assignee info (flat)
  assignedToId: string | null
  assignedToName: string | null

  // Message count
  messageCount: number

  // Dates (ISO strings)
  createdAt: string
  updatedAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of tickets matching filters */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of pages */
  totalPages: number
  /** Whether there are more pages */
  hasMore: boolean
}

/**
 * Response from GET /api/tickets
 * Returns paginated list of tickets with metadata
 */
export interface GetTicketsResponse {
  /** Array of ticket summaries */
  tickets: TicketListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}

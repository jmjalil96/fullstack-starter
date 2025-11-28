/**
 * DTOs for creating tickets
 */

import { TicketPriority, TicketStatus } from '@prisma/client'

/**
 * Request DTO - What client sends
 */
export interface CreateTicketRequest {
  /** Ticket subject/title */
  subject: string

  /** Initial message content (required) */
  message: string

  /** Ticket priority (optional, defaults to NORMAL) */
  priority?: TicketPriority

  /** Ticket category (optional) */
  category?: string

  /** Client ID (required) */
  clientId: string

  /** Reporter ID - the client user reporting the issue (optional, for broker creating on behalf) */
  reporterId?: string

  /** Related claim ID (optional) */
  relatedClaimId?: string

  /** Assigned employee ID (optional, broker only) */
  assignedToId?: string
}

/**
 * Message in response DTO
 */
export interface TicketMessageResponse {
  id: string
  message: string
  authorId: string
  authorName: string
  createdAt: string
}

/**
 * Response DTO - What API returns after creation
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

  reporterId: string | null
  reporterName: string | null

  relatedClaimId: string | null
  relatedClaimNumber: string | null

  createdById: string
  createdByName: string

  assignedToId: string | null
  assignedToName: string | null

  createdAt: string
  updatedAt: string

  messages: TicketMessageResponse[]
}

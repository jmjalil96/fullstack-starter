/**
 * DTO for ticket detail view (GET /api/tickets/:id)
 */

import { TicketPriority, TicketStatus } from '@prisma/client'

/**
 * Message in ticket detail
 */
export interface TicketMessageDetail {
  id: string
  message: string
  authorId: string
  authorName: string
  createdAt: string
}

/**
 * Complete ticket detail with all fields
 * plus minimal references to related entities (id + display name)
 * and full messages array
 */
export interface TicketDetailResponse {
  // ============================================================================
  // TICKET TABLE - ALL FIELDS
  // ============================================================================

  /** Unique ticket ID (CUID) */
  id: string

  /** Sequential number from PostgreSQL sequence */
  ticketSequence: number

  /** Human-readable ticket number (TKT_XXXXXXXX format) */
  ticketNumber: string

  /** Ticket subject/title */
  subject: string

  /** Current ticket status */
  status: TicketStatus

  /** Ticket priority */
  priority: TicketPriority

  /** Ticket category (optional) */
  category: string | null

  /** When the ticket was closed (optional) */
  closedAt: string | null

  /** When the ticket was created */
  createdAt: string

  /** When the ticket was last updated */
  updatedAt: string

  // ============================================================================
  // RELATED ENTITIES - FLAT REFERENCES (ID + DISPLAY NAME)
  // ============================================================================

  /** Client ID */
  clientId: string

  /** Client name for display */
  clientName: string

  /** Reporter ID (client user who reported the issue) */
  reporterId: string | null

  /** Reporter name for display */
  reporterName: string | null

  /** ID of user who created the ticket */
  createdById: string

  /** Name of user who created the ticket */
  createdByName: string

  /** ID of assigned employee */
  assignedToId: string | null

  /** Name of assigned employee */
  assignedToName: string | null

  /** Related claim ID (optional) */
  relatedClaimId: string | null

  /** Related claim number for display (optional) */
  relatedClaimNumber: string | null

  // ============================================================================
  // MESSAGES
  // ============================================================================

  /** Full messages array ordered by creation time */
  messages: TicketMessageDetail[]
}

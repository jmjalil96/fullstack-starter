/**
 * DTOs for updating tickets
 */

/**
 * Request DTO - What client sends
 */
export interface TicketUpdateRequest {
  status?: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  category?: string | null
}

/**
 * Response DTO - What API returns after update
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

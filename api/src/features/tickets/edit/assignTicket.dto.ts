/**
 * DTOs for assigning tickets
 */

/**
 * Request DTO - What client sends
 */
export interface AssignTicketRequest {
  assignedToId: string | null
}

/**
 * Response DTO - What API returns after assignment
 */
export interface AssignTicketResponse {
  id: string
  ticketNumber: string
  assignedToId: string | null
  assignedToName: string | null
  updatedAt: string
}

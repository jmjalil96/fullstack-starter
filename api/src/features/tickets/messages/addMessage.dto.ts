/**
 * DTOs for adding messages to tickets
 */

/**
 * Request DTO - What client sends
 */
export interface AddMessageRequest {
  /** Message content */
  message: string
}

/**
 * Response DTO - What API returns after creation
 */
export interface AddMessageResponse {
  id: string
  message: string
  authorId: string
  authorName: string
  ticketId: string
  ticketNumber: string
  createdAt: string
}

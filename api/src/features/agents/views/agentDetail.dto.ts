/**
 * DTO for agent detail view (GET /api/agents/:id)
 */

/**
 * Complete agent detail with all fields from Agent table
 *
 * Follows flat structure pattern for consistency
 */
export interface AgentDetailResponse {
  // ============================================================================
  // AGENT TABLE - ALL FIELDS
  // ============================================================================

  /** Unique agent ID (CUID) */
  id: string

  /** First name */
  firstName: string

  /** Last name */
  lastName: string

  /** Email address */
  email: string

  /** Phone number */
  phone: string | null

  /** Unique agent code */
  agentCode: string | null

  // User account link
  /** Linked user ID (if has account) */
  userId: string | null

  /** Whether agent has a user account */
  hasUserAccount: boolean

  // Status
  /** Whether agent is active */
  isActive: boolean

  // Timestamps (ISO strings)
  /** When the agent was created */
  createdAt: string

  /** When the agent was last updated */
  updatedAt: string
}

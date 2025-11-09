/**
 * DTO for client detail view (GET /api/clients/:id)
 */

/**
 * Complete client detail with all fields from Client table
 *
 * Simple standalone entity with no required relations.
 * For future enhancements, could add aggregate counts (affiliateCount, policyCount, etc.)
 */
export interface ClientDetailResponse {
  // ============================================================================
  // CLIENT TABLE - ALL FIELDS
  // ============================================================================

  /** Unique client ID (CUID) */
  id: string

  /** Client company name */
  name: string

  /** Tax identification number (RUC/NIT) - unique business identifier */
  taxId: string

  /** Primary contact email */
  email: string | null

  /** Primary contact phone */
  phone: string | null

  /** Business address */
  address: string | null

  /** Whether client is active */
  isActive: boolean

  /** When the client was created */
  createdAt: string

  /** When the client was last updated */
  updatedAt: string
}

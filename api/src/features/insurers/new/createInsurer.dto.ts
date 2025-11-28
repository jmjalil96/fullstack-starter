/**
 * DTOs for creating insurers (POST /api/insurers)
 */

/**
 * Request body for creating an insurer
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can create insurers
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Validation:
 * - name: required, unique, 2-100 chars
 * - code: optional, unique, 2-20 chars (will be uppercased)
 * - email: optional, valid email format
 * - phone: optional, 7-20 chars
 * - website: optional, valid URL format
 *
 * @example
 * {
 *   "name": "MAPFRE",
 *   "code": "MAPFRE",
 *   "email": "contacto@mapfre.com.pe",
 *   "phone": "+51-1-2345678",
 *   "website": "https://www.mapfre.com.pe"
 * }
 */
export interface CreateInsurerRequest {
  /** Insurer name (required, unique) */
  name: string

  /** Short code (optional, unique, will be uppercased) */
  code?: string

  /** Contact email */
  email?: string

  /** Contact phone */
  phone?: string

  /** Website URL */
  website?: string

  /** Day of month for billing cutoff (1-28, defaults to 25) */
  billingCutoffDay?: number
}

/**
 * Response from POST /api/insurers
 *
 * Returns complete created insurer with all fields.
 */
export interface CreateInsurerResponse {
  /** Unique insurer ID (CUID) */
  id: string

  /** Insurer name */
  name: string

  /** Insurer code */
  code: string | null

  /** Contact email */
  email: string | null

  /** Contact phone */
  phone: string | null

  /** Website URL */
  website: string | null

  /** Day of month for billing cutoff (1-28) */
  billingCutoffDay: number

  /** Whether insurer is active (always true on creation) */
  isActive: boolean

  /** When the insurer was created (ISO string) */
  createdAt: string

  /** When the insurer was last updated (ISO string) */
  updatedAt: string
}

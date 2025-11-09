/**
 * DTOs for creating clients
 */

/**
 * Request DTO - What client sends
 */
export interface CreateClientRequest {
  /** Client company name */
  name: string
  /** Tax identification number (RUC/NIT) - unique business identifier */
  taxId: string
  /** Primary contact email (optional) */
  email?: string
  /** Primary contact phone (optional) */
  phone?: string
  /** Business address (optional) */
  address?: string
}

/**
 * Response DTO - What API returns after creation
 */
export interface CreateClientResponse {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

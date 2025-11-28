/**
 * Insurers type definitions
 * Mirrors backend DTOs from api/src/features/insurers/
 */

import type { PaginationMetadata } from '../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

/**
 * Single insurer item in list view
 * Mirrors: api/src/features/insurers/views/viewInsurers.dto.ts
 */
export interface InsurerListItemResponse {
  // Core identification
  id: string
  name: string
  code: string | null

  // Contact info
  email: string | null
  phone: string | null

  // Status
  isActive: boolean
}

/**
 * Response from GET /api/insurers
 * Mirrors: api/src/features/insurers/views/viewInsurers.dto.ts
 */
export interface GetInsurersResponse {
  insurers: InsurerListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Complete insurer detail with all fields
 * Mirrors: api/src/features/insurers/views/insurerDetail.dto.ts
 */
export interface InsurerDetailResponse {
  // Core identification
  id: string
  name: string
  code: string | null

  // Contact info
  email: string | null
  phone: string | null
  website: string | null

  // Status
  isActive: boolean

  // Timestamps (ISO strings)
  createdAt: string
  updatedAt: string
}

/**
 * Create insurer request body
 * Mirrors: api/src/features/insurers/new/createInsurer.dto.ts
 * Sent to POST /api/insurers
 */
export interface CreateInsurerRequest {
  name: string
  code?: string
  email?: string
  phone?: string
  website?: string
}

/**
 * Create insurer response
 * Mirrors: api/src/features/insurers/new/createInsurer.dto.ts
 * Returned from POST /api/insurers
 */
export interface CreateInsurerResponse {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  website: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Update insurer request body
 * Mirrors: api/src/features/insurers/edit/insurerEdit.dto.ts
 * Sent to PUT /api/insurers/:id
 */
export interface UpdateInsurerRequest {
  name?: string
  code?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  isActive?: boolean
}

/**
 * Update insurer response (same as detail response)
 * Mirrors: api/src/features/insurers/edit/insurerEdit.dto.ts
 * Returned from PUT /api/insurers/:id
 */
export type UpdateInsurerResponse = InsurerDetailResponse

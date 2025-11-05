/**
 * Claims API service layer
 * Type-safe wrappers around fetchAPI for claims endpoints
 */

import { fetchAPI } from '../../config/api'
import type {
  AvailableAffiliateResponse,
  AvailableClientResponse,
  AvailablePatientResponse,
  CreateClaimRequest,
  CreateClaimResponse,
} from '../types/claims'

/**
 * Get available clients for claim submission
 *
 * @returns Array of clients the current user can submit claims for
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const clients = await getAvailableClients()
 * // Returns: [{ id: '...', name: 'TechCorp' }, ...]
 */
export async function getAvailableClients(): Promise<AvailableClientResponse[]> {
  return fetchAPI<AvailableClientResponse[]>('/api/claims/available-clients')
}

/**
 * Get available affiliates for a specific client
 *
 * @param clientId - Client ID to fetch affiliates for
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of owner affiliates for the client
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const affiliates = await getAvailableAffiliates('client-123')
 * // Returns: [{ id: '...', firstName: 'Juan', lastName: 'Pérez', coverageType: 'FULL' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const affiliates = await getAvailableAffiliates('client-123', { signal: controller.signal })
 */
export async function getAvailableAffiliates(
  clientId: string,
  options?: RequestInit
): Promise<AvailableAffiliateResponse[]> {
  return fetchAPI<AvailableAffiliateResponse[]>(
    `/api/claims/available-affiliates?clientId=${encodeURIComponent(clientId)}`,
    options
  )
}

/**
 * Get available patients for a specific affiliate
 *
 * @param affiliateId - Affiliate ID to fetch patients for (affiliate + dependents)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of patients (affiliate as 'self' + dependents)
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const patients = await getAvailablePatients('affiliate-123')
 * // Returns: [
 * //   { id: '...', firstName: 'Juan', lastName: 'Pérez', relationship: 'self' },
 * //   { id: '...', firstName: 'María', lastName: 'Pérez', relationship: 'dependent' }
 * // ]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const patients = await getAvailablePatients('affiliate-123', { signal: controller.signal })
 */
export async function getAvailablePatients(
  affiliateId: string,
  options?: RequestInit
): Promise<AvailablePatientResponse[]> {
  return fetchAPI<AvailablePatientResponse[]>(
    `/api/claims/available-patients?affiliateId=${encodeURIComponent(affiliateId)}`,
    options
  )
}

/**
 * Create a new claim
 *
 * @param data - Claim data (client, affiliate, patient, description)
 * @returns Created claim with claim number and details
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const claim = await createClaim({
 *   clientId: 'client-123',
 *   affiliateId: 'aff-456',
 *   patientId: 'aff-456',
 *   description: 'Consulta médica'
 * })
 * // Returns: { id: '...', claimNumber: 'RECL_ABC123', status: 'SUBMITTED', ... }
 */
export async function createClaim(data: CreateClaimRequest): Promise<CreateClaimResponse> {
  return fetchAPI<CreateClaimResponse>('/api/claims', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Claims hooks - barrel export
 */

export { useAvailableClients } from './useAvailableClients'
export { useAvailableAffiliates } from './useAvailableAffiliates'
export { useAvailablePatients } from './useAvailablePatients'
export { useCreateClaim } from './useCreateClaim'
export type {
  AvailableAffiliateResponse,
  AvailableClientResponse,
  AvailablePatientResponse,
  CreateClaimRequest,
  CreateClaimResponse,
} from '../../types/claims'

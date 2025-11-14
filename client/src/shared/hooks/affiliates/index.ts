/**
 * Affiliates hooks - barrel export
 */

export { useAvailableClients } from './useAvailableClients'
export { useAvailableOwners } from './useAvailableOwners'
export { useCreateAffiliate } from './useCreateAffiliate'
export { useGetAffiliateDetail } from './useGetAffiliateDetail'
export { useGetAffiliates } from './useGetAffiliates'
export { useUpdateAffiliate } from './useUpdateAffiliate'

export type {
  AffiliateDetailResponse,
  AffiliateListItemResponse,
  AffiliateType,
  AvailableClientResponse,
  AvailableOwnerResponse,
  CoverageType,
  CreateAffiliateRequest,
  CreateAffiliateResponse,
  GetAffiliatesResponse,
  PaginationMetadata,
  UpdateAffiliateRequest,
  UpdateAffiliateResponse,
} from '../../types/affiliates'

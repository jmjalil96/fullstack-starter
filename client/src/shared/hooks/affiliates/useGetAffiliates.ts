/**
 * Hook for fetching paginated list of affiliates with filters
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAffiliates } from '../../services/affiliatesApi'
import type {
  AffiliateListItemResponse,
  AffiliateType,
  CoverageType,
  PaginationMetadata,
} from '../../types/affiliates'

/**
 * Return type for useGetAffiliates hook
 */
interface UseGetAffiliatesReturn {
  /** Array of affiliates */
  affiliates: AffiliateListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch affiliates manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch paginated list of affiliates with optional filters
 *
 * Auto-fetches on mount and refetches when params change.
 * Returns affiliates based on current user's role and permissions.
 *
 * @param params - Optional query parameters (clientId, search, affiliateType, coverageType, isActive, page, limit)
 * @returns {UseGetAffiliatesReturn} Affiliates data, pagination, loading state, error, and refetch function
 *
 * @example
 * // Get all affiliates (first page, default limit)
 * const { affiliates, pagination, loading, error } = useGetAffiliates()
 *
 * @example
 * // Filter by client
 * const { affiliates, loading } = useGetAffiliates({ clientId: 'client-123' })
 *
 * @example
 * // Filter by affiliate type
 * const { affiliates, loading } = useGetAffiliates({ affiliateType: 'OWNER' })
 *
 * @example
 * // Filter by coverage type
 * const { affiliates, loading } = useGetAffiliates({ coverageType: 'TPLUSF' })
 *
 * @example
 * // Filter by active status
 * const { affiliates, loading } = useGetAffiliates({ isActive: true })
 *
 * @example
 * // With pagination
 * const [page, setPage] = useState(1)
 * const { affiliates, pagination } = useGetAffiliates({ page, limit: 10 })
 *
 * @example
 * // Search by name or document
 * const { affiliates, loading } = useGetAffiliates({ search: 'Juan Pérez' })
 */
export function useGetAffiliates(params?: {
  clientId?: string
  search?: string
  affiliateType?: AffiliateType
  coverageType?: CoverageType
  isActive?: boolean
  page?: number
  limit?: number
}): UseGetAffiliatesReturn {
  const [affiliates, setAffiliates] = useState<AffiliateListItemResponse[]>([])
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Stringify params for stable dependency (prevents infinite loop from object reference changes)
  const paramsKey = JSON.stringify(params || {})

  // Auto-fetch when params change (with AbortController)
  useEffect(() => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchAffiliates = async () => {
      setLoading(true)
      setError(null)
      // Keep current affiliates/pagination visible during load (smooth UX)

      try {
        const response = await getAffiliates(params, { signal: controller.signal })
        // Replace data on success
        setAffiliates(response.affiliates)
        setPagination(response.pagination)
      } catch (err) {
        // Ignore aborted requests (user changed params)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver afiliados')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar afiliados. Intenta de nuevo.')
        }
        // Clear data only on real errors
        setAffiliates([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliates()

    // Cleanup: abort request if params change before completion
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]) // Use stringified params for stable dependency

  /**
   * Manual refetch function (with AbortController to cancel in-flight requests)
   */
  const refetch = useCallback(async () => {
    // Abort any in-flight request before refetching
    abortControllerRef.current?.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await getAffiliates(params, { signal: controller.signal })
      setAffiliates(response.affiliates)
      setPagination(response.pagination)
    } catch (err) {
      // Ignore aborted requests
      if ((err as Error).name === 'AbortError') {
        return
      }

      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver afiliados')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar afiliados. Intenta de nuevo.')
      }
      setAffiliates([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return {
    affiliates,
    pagination,
    loading,
    error,
    refetch,
  }
}

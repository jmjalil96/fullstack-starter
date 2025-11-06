/**
 * Hook for fetching paginated list of claims with filters
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getClaims } from '../../services/claimsApi'
import type { ClaimListItemResponse, ClaimStatus, PaginationMetadata } from '../../types/claims'

/**
 * Return type for useGetClaims hook
 */
interface UseGetClaimsReturn {
  /** Array of claims */
  claims: ClaimListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch claims manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch paginated list of claims with optional filters
 *
 * Auto-fetches on mount and refetches when params change.
 * Returns claims based on current user's role and permissions.
 *
 * @param params - Optional query parameters (status, clientId, search, page, limit)
 * @returns {UseGetClaimsReturn} Claims data, pagination, loading state, error, and refetch function
 *
 * @example
 * // Get all claims (first page, default limit)
 * const { claims, pagination, loading, error } = useGetClaims()
 *
 * @example
 * // Filter by status
 * const { claims, loading } = useGetClaims({ status: 'SUBMITTED' })
 *
 * @example
 * // With pagination
 * const [page, setPage] = useState(1)
 * const { claims, pagination } = useGetClaims({ page, limit: 10 })
 *
 * @example
 * // Search by claim number
 * const { claims, loading } = useGetClaims({ search: 'RECL_ABC123' })
 */
export function useGetClaims(params?: {
  status?: ClaimStatus
  clientId?: string
  search?: string
  page?: number
  limit?: number
}): UseGetClaimsReturn {
  const [claims, setClaims] = useState<ClaimListItemResponse[]>([])
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

    const fetchClaims = async () => {
      setLoading(true)
      setError(null)
      // Keep current claims/pagination visible during load (smooth UX)

      try {
        const response = await getClaims(params, { signal: controller.signal })
        // Replace data on success
        setClaims(response.claims)
        setPagination(response.pagination)
      } catch (err) {
        // Ignore aborted requests (user changed params)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver reclamos')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar reclamos. Intenta de nuevo.')
        }
        // Clear data only on real errors
        setClaims([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    fetchClaims()

    // Cleanup: abort request if params change before completion
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]) // Use stringified params for stable dependency

  /**
   * Manual refetch function (without AbortController)
   */
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getClaims(params)
      setClaims(response.claims)
      setPagination(response.pagination)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver reclamos')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar reclamos. Intenta de nuevo.')
      }
      setClaims([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return {
    claims,
    pagination,
    loading,
    error,
    refetch,
  }
}

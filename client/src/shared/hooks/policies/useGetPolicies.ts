/**
 * Hook for fetching paginated list of policies with filters
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getPolicies } from '../../services/policiesApi'
import type { PaginationMetadata, PolicyListItemResponse, PolicyStatus } from '../../types/policies'

/**
 * Return type for useGetPolicies hook
 */
interface UseGetPoliciesReturn {
  /** Array of policies */
  policies: PolicyListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch policies manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch paginated list of policies with optional filters
 *
 * Auto-fetches on mount and refetches when params change.
 * Returns policies based on current user's role and permissions.
 *
 * @param params - Optional query parameters (status, clientId, insurerId, search, page, limit)
 * @returns {UseGetPoliciesReturn} Policies data, pagination, loading state, error, and refetch function
 *
 * @example
 * // Get all policies (first page, default limit)
 * const { policies, pagination, loading, error } = useGetPolicies()
 *
 * @example
 * // Filter by status
 * const { policies, loading } = useGetPolicies({ status: 'ACTIVE' })
 *
 * @example
 * // Filter by client
 * const { policies, loading } = useGetPolicies({ clientId: 'client-123' })
 *
 * @example
 * // Filter by insurer
 * const { policies, loading } = useGetPolicies({ insurerId: 'insurer-456' })
 *
 * @example
 * // With pagination
 * const [page, setPage] = useState(1)
 * const { policies, pagination } = useGetPolicies({ page, limit: 10 })
 *
 * @example
 * // Search by policy number
 * const { policies, loading } = useGetPolicies({ search: 'POL-TEST-001' })
 */
export function useGetPolicies(params?: {
  status?: PolicyStatus
  clientId?: string
  insurerId?: string
  search?: string
  page?: number
  limit?: number
}): UseGetPoliciesReturn {
  const [policies, setPolicies] = useState<PolicyListItemResponse[]>([])
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

    const fetchPolicies = async () => {
      setLoading(true)
      setError(null)
      // Keep current policies/pagination visible during load (smooth UX)

      try {
        const response = await getPolicies(params, { signal: controller.signal })
        // Replace data on success
        setPolicies(response.policies)
        setPagination(response.pagination)
      } catch (err) {
        // Ignore aborted requests (user changed params)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver pólizas')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar pólizas. Intenta de nuevo.')
        }
        // Clear data only on real errors
        setPolicies([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()

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
      const response = await getPolicies(params, { signal: controller.signal })
      setPolicies(response.policies)
      setPagination(response.pagination)
    } catch (err) {
      // Ignore aborted requests
      if ((err as Error).name === 'AbortError') {
        return
      }

      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver pólizas')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar pólizas. Intenta de nuevo.')
      }
      setPolicies([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return {
    policies,
    pagination,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching complete policy detail by ID
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getPolicyById } from '../../services/policiesApi'
import type { PolicyDetailResponse } from '../../types/policies'

/**
 * Return type for useGetPolicyDetail hook
 */
interface UseGetPolicyDetailReturn {
  /** Policy detail data */
  policy: PolicyDetailResponse | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch policy manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch complete policy detail by ID
 *
 * Auto-fetches on mount and refetches when policyId changes.
 * Returns policy based on current user's permissions.
 *
 * @param policyId - Policy ID to fetch
 * @returns {UseGetPolicyDetailReturn} Policy data, loading state, error, and refetch function
 *
 * @example
 * function PolicyDetailPage() {
 *   const { id } = useParams()
 *   const { policy, loading, error, refetch } = useGetPolicyDetail(id!)
 *
 *   if (loading && !policy) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *   if (!policy) return <NotFound />
 *
 *   return <PolicyDetailView policy={policy} onUpdate={refetch} />
 * }
 */
export function useGetPolicyDetail(policyId: string): UseGetPolicyDetailReturn {
  const [policy, setPolicy] = useState<PolicyDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when policyId changes (with AbortController)
  useEffect(() => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchPolicy = async () => {
      setLoading(true)
      setError(null)
      // Keep current policy visible during load (smooth UX)

      try {
        const data = await getPolicyById(policyId, { signal: controller.signal })
        // Replace policy on success
        setPolicy(data)
      } catch (err) {
        // Ignore aborted requests (user navigated away or policyId changed)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            setError('Póliza no encontrada')
          } else if (err.statusCode === 403) {
            setError('No tienes permiso para ver esta póliza')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar póliza. Intenta de nuevo.')
        }
        // Clear policy only on real errors
        setPolicy(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicy()

    // Cleanup: abort request if policyId changes before completion
    return () => {
      controller.abort()
    }
  }, [policyId]) // Refetch when policyId changes

  /**
   * Manual refetch function
   * Useful after policy updates to get fresh data
   */
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getPolicyById(policyId)
      setPolicy(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setError('Póliza no encontrada')
        } else if (err.statusCode === 403) {
          setError('No tienes permiso para ver esta póliza')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar póliza. Intenta de nuevo.')
      }
      setPolicy(null)
    } finally {
      setLoading(false)
    }
  }, [policyId])

  return {
    policy,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching available policies for a claim
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAvailablePolicies } from '../../services/claimsApi'
import type { AvailablePolicyResponse } from '../../types/claims'

/**
 * Return type for useAvailablePolicies hook
 */
interface UseAvailablePoliciesReturn {
  /** Array of available policies */
  policies: AvailablePolicyResponse[]
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch policies manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch policies available for a claim
 *
 * Auto-fetches on mount and refetches when claimId changes.
 * Returns policies where claim's affiliate is covered (PolicyAffiliate join).
 *
 * @param claimId - Claim ID to get policies for
 * @returns {UseAvailablePoliciesReturn} Policies data, loading state, error, and refetch function
 *
 * @example
 * function EditClaimModal({ claim }) {
 *   const { policies, loading, error } = useAvailablePolicies(claim.id)
 *
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *
 *   return (
 *     <select>
 *       {policies.length === 0 ? (
 *         <option disabled>No hay pólizas disponibles</option>
 *       ) : (
 *         policies.map(policy => (
 *           <option key={policy.id} value={policy.id}>
 *             {policy.policyNumber} — {policy.insurerName}
 *           </option>
 *         ))
 *       )}
 *     </select>
 *   )
 * }
 */
export function useAvailablePolicies(claimId: string): UseAvailablePoliciesReturn {
  const [policies, setPolicies] = useState<AvailablePolicyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when claimId changes (with AbortController)
  useEffect(() => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchPolicies = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getAvailablePolicies(claimId, { signal: controller.signal })
        setPolicies(data)
      } catch (err) {
        // Ignore aborted requests (modal closed or claimId changed)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            setError('Reclamo no encontrado')
          } else if (err.statusCode === 403) {
            setError('No tienes permiso para ver pólizas de este reclamo')
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
        // Return empty array on error (safe for dropdown)
        setPolicies([])
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()

    // Cleanup: abort request if claimId changes or modal closes
    return () => {
      controller.abort()
    }
  }, [claimId])

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAvailablePolicies(claimId)
      setPolicies(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setError('Reclamo no encontrado')
        } else if (err.statusCode === 403) {
          setError('No tienes permiso para ver pólizas de este reclamo')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar pólizas. Intenta de nuevo.')
      }
      // Return empty array on error (safe for dropdown)
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }, [claimId])

  return {
    policies,
    loading,
    error,
    refetch,
  }
}

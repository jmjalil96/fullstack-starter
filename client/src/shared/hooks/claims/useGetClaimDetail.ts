/**
 * Hook for fetching complete claim detail by ID
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getClaimById } from '../../services/claimsApi'
import type { ClaimDetailResponse } from '../../types/claims'

/**
 * Return type for useGetClaimDetail hook
 */
interface UseGetClaimDetailReturn {
  /** Claim detail data */
  claim: ClaimDetailResponse | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch claim manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch complete claim detail by ID
 *
 * Auto-fetches on mount and refetches when claimId changes.
 * Returns claim based on current user's permissions.
 *
 * @param claimId - Claim ID to fetch
 * @returns {UseGetClaimDetailReturn} Claim data, loading state, error, and refetch function
 *
 * @example
 * function ClaimDetailPage() {
 *   const { id } = useParams()
 *   const { claim, loading, error, refetch } = useGetClaimDetail(id!)
 *
 *   if (loading && !claim) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *   if (!claim) return <NotFound />
 *
 *   return <ClaimDetailView claim={claim} onUpdate={refetch} />
 * }
 */
export function useGetClaimDetail(claimId: string): UseGetClaimDetailReturn {
  const [claim, setClaim] = useState<ClaimDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when claimId changes (with AbortController)
  useEffect(() => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchClaim = async () => {
      setLoading(true)
      setError(null)
      // Keep current claim visible during load (smooth UX)

      try {
        const data = await getClaimById(claimId, { signal: controller.signal })
        // Replace claim on success
        setClaim(data)
      } catch (err) {
        // Ignore aborted requests (user navigated away or claimId changed)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            setError('Reclamo no encontrado')
          } else if (err.statusCode === 403) {
            setError('No tienes permiso para ver este reclamo')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar reclamo. Intenta de nuevo.')
        }
        // Clear claim only on real errors
        setClaim(null)
      } finally {
        setLoading(false)
      }
    }

    fetchClaim()

    // Cleanup: abort request if claimId changes before completion
    return () => {
      controller.abort()
    }
  }, [claimId]) // Refetch when claimId changes

  /**
   * Manual refetch function
   * Useful after claim updates to get fresh data
   */
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getClaimById(claimId)
      setClaim(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setError('Reclamo no encontrado')
        } else if (err.statusCode === 403) {
          setError('No tienes permiso para ver este reclamo')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar reclamo. Intenta de nuevo.')
      }
      setClaim(null)
    } finally {
      setLoading(false)
    }
  }, [claimId])

  return {
    claim,
    loading,
    error,
    refetch,
  }
}

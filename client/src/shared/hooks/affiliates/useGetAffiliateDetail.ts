/**
 * Hook for fetching complete affiliate detail by ID
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAffiliateById } from '../../services/affiliatesApi'
import type { AffiliateDetailResponse } from '../../types/affiliates'

/**
 * Return type for useGetAffiliateDetail hook
 */
interface UseGetAffiliateDetailReturn {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch affiliate manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch complete affiliate detail by ID
 *
 * Auto-fetches on mount and refetches when affiliateId changes.
 * Returns affiliate based on current user's permissions.
 *
 * @param affiliateId - Affiliate ID to fetch
 * @returns {UseGetAffiliateDetailReturn} Affiliate data, loading state, error, and refetch function
 *
 * @example
 * function AffiliateDetailPage() {
 *   const { id } = useParams()
 *   const { affiliate, loading, error, refetch } = useGetAffiliateDetail(id!)
 *
 *   if (loading && !affiliate) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *   if (!affiliate) return <NotFound />
 *
 *   return <AffiliateDetailView affiliate={affiliate} onUpdate={refetch} />
 * }
 */
export function useGetAffiliateDetail(affiliateId: string): UseGetAffiliateDetailReturn {
  const [affiliate, setAffiliate] = useState<AffiliateDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when affiliateId changes (with AbortController)
  useEffect(() => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchAffiliate = async () => {
      setLoading(true)
      setError(null)
      // Keep current affiliate visible during load (smooth UX)

      try {
        const data = await getAffiliateById(affiliateId, { signal: controller.signal })
        // Replace affiliate on success
        setAffiliate(data)
      } catch (err) {
        // Ignore aborted requests (user navigated away or affiliateId changed)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            setError('Afiliado no encontrado')
          } else if (err.statusCode === 403) {
            setError('No tienes permiso para ver este afiliado')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar afiliado. Intenta de nuevo.')
        }
        // Clear affiliate only on real errors
        setAffiliate(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliate()

    // Cleanup: abort request if affiliateId changes before completion
    return () => {
      controller.abort()
    }
  }, [affiliateId]) // Refetch when affiliateId changes

  /**
   * Manual refetch function
   * Useful after affiliate updates to get fresh data
   */
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAffiliateById(affiliateId)
      setAffiliate(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setError('Afiliado no encontrado')
        } else if (err.statusCode === 403) {
          setError('No tienes permiso para ver este afiliado')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar afiliado. Intenta de nuevo.')
      }
      setAffiliate(null)
    } finally {
      setLoading(false)
    }
  }, [affiliateId])

  return {
    affiliate,
    loading,
    error,
    refetch,
  }
}

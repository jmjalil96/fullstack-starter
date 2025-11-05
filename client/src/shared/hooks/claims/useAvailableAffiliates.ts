/**
 * Hook for fetching available affiliates for a specific client
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAvailableAffiliates } from '../../services/claimsApi'
import type { AvailableAffiliateResponse } from '../../types/claims'

/**
 * Return type for useAvailableAffiliates hook
 */
interface UseAvailableAffiliatesReturn {
  /** Array of available affiliates */
  affiliates: AvailableAffiliateResponse[]
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch affiliates manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch available affiliates for a specific client
 *
 * Fetches only when clientId is provided. Resets and refetches when clientId changes.
 * Returns owner affiliates based on current user's permissions.
 *
 * @param clientId - Client ID to fetch affiliates for (null/undefined to skip fetch)
 * @returns {UseAvailableAffiliatesReturn} Affiliates data, loading state, error, and refetch function
 *
 * @example
 * function NewClaimForm() {
 *   const [selectedClient, setSelectedClient] = useState<string | null>(null)
 *   const { affiliates, loading, error } = useAvailableAffiliates(selectedClient)
 *
 *   if (!selectedClient) return <p>Selecciona un cliente primero</p>
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *
 *   return (
 *     <select>
 *       {affiliates.map(aff => (
 *         <option key={aff.id} value={aff.id}>
 *           {aff.firstName} {aff.lastName}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 */
export function useAvailableAffiliates(
  clientId: string | null | undefined
): UseAvailableAffiliatesReturn {
  const [affiliates, setAffiliates] = useState<AvailableAffiliateResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when clientId changes (with AbortController)
  useEffect(() => {
    // Don't fetch if no clientId provided
    if (!clientId) {
      setAffiliates([])
      setLoading(false)
      setError(null)
      return
    }

    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchAffiliates = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getAvailableAffiliates(clientId, { signal: controller.signal })
        setAffiliates(data)
      } catch (err) {
        // Ignore aborted requests (user changed selection)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver afiliados')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else if (err.statusCode === 404) {
            setError('Cliente no encontrado')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar afiliados. Intenta de nuevo.')
        }
        // Clear affiliates on error
        setAffiliates([])
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliates()

    // Cleanup: abort request if clientId changes before completion
    return () => {
      controller.abort()
    }
  }, [clientId])

  /**
   * Manual refetch function (without AbortController)
   */
  const refetch = useCallback(async () => {
    if (!clientId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getAvailableAffiliates(clientId)
      setAffiliates(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver afiliados')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else if (err.statusCode === 404) {
          setError('Cliente no encontrado')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar afiliados. Intenta de nuevo.')
      }
      setAffiliates([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  return {
    affiliates,
    loading,
    error,
    refetch,
  }
}

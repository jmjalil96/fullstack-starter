/**
 * Hook for fetching available owner affiliates for primary affiliate selection
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAvailableOwners } from '../../services/affiliatesApi'
import type { AvailableOwnerResponse } from '../../types/affiliates'

/**
 * Return type for useAvailableOwners hook
 */
interface UseAvailableOwnersReturn {
  /** Array of available owner affiliates */
  owners: AvailableOwnerResponse[]
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch owners manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch available owner affiliates for primary affiliate selection
 *
 * Fetches only when clientId is provided. Resets and refetches when clientId changes.
 * Returns active OWNER affiliates from the specified client.
 * Used when creating DEPENDENT affiliates to select their primary affiliate.
 *
 * @param clientId - Client ID to fetch owners for (null/undefined to skip fetch)
 * @returns {UseAvailableOwnersReturn} Owners data, loading state, error, and refetch function
 *
 * @example
 * function NewDependentForm() {
 *   const [selectedClient, setSelectedClient] = useState<string | null>(null)
 *   const { owners, loading, error } = useAvailableOwners(selectedClient)
 *
 *   if (!selectedClient) return <p>Selecciona un cliente primero</p>
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *
 *   return (
 *     <select>
 *       {owners.map(owner => (
 *         <option key={owner.id} value={owner.id}>
 *           {owner.firstName} {owner.lastName}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 */
export function useAvailableOwners(
  clientId: string | null | undefined
): UseAvailableOwnersReturn {
  const [owners, setOwners] = useState<AvailableOwnerResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when clientId changes (with AbortController)
  useEffect(() => {
    // Don't fetch if no clientId provided
    if (!clientId) {
      setOwners([])
      setLoading(false)
      setError(null)
      return
    }

    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchOwners = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getAvailableOwners(clientId, { signal: controller.signal })
        setOwners(data)
      } catch (err) {
        // Ignore aborted requests (user changed selection)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver afiliados titulares')
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
          setError('Error al cargar afiliados titulares. Intenta de nuevo.')
        }
        // Clear owners on error
        setOwners([])
      } finally {
        setLoading(false)
      }
    }

    fetchOwners()

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
      const data = await getAvailableOwners(clientId)
      setOwners(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver afiliados titulares')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else if (err.statusCode === 404) {
          setError('Cliente no encontrado')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar afiliados titulares. Intenta de nuevo.')
      }
      setOwners([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  return {
    owners,
    loading,
    error,
    refetch,
  }
}

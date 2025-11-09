/**
 * Hook for fetching a single client detail by ID
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getClientById } from '../../services/clientsApi'
import type { ClientDetailResponse } from '../../types/clients'

/**
 * Return type for useGetClientDetail hook
 */
interface UseGetClientDetailReturn {
  /** Client data (null until loaded) */
  client: ClientDetailResponse | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch client manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch a single client by ID
 *
 * Auto-fetches on mount and refetches when clientId changes.
 * Returns client based on current user's role and permissions.
 *
 * @param clientId - Client ID to fetch (CUID)
 * @returns {UseGetClientDetailReturn} Client data, loading state, error, and refetch function
 *
 * @example
 * const { client, loading, error, refetch } = useGetClientDetail('client-123')
 *
 * if (loading) return <Spinner />
 * if (error) return <ErrorBanner error={error} />
 * if (!client) return null
 *
 * return <ClientDetails client={client} />
 */
export function useGetClientDetail(clientId: string): UseGetClientDetailReturn {
  const [client, setClient] = useState<ClientDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when clientId changes (with AbortController)
  useEffect(() => {
    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchClient = async () => {
      setLoading(true)
      setError(null)
      // Keep current client visible during refetch (smooth UX)

      try {
        const response = await getClientById(clientId, { signal: controller.signal })
        setClient(response)
      } catch (err) {
        // Ignore aborted requests (user navigated away or clientId changed)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            setError('Cliente no encontrado')
          } else if (err.statusCode === 403) {
            setError('No tienes permiso para ver este cliente')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar cliente. Intenta de nuevo.')
        }
        // Clear client only on real errors
        setClient(null)
      } finally {
        setLoading(false)
      }
    }

    fetchClient()

    // Cleanup: abort request if clientId changes before completion
    return () => {
      controller.abort()
    }
  }, [clientId])

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
      const response = await getClientById(clientId, { signal: controller.signal })
      setClient(response)
    } catch (err) {
      // Ignore aborted requests
      if ((err as Error).name === 'AbortError') {
        return
      }

      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setError('Cliente no encontrado')
        } else if (err.statusCode === 403) {
          setError('No tienes permiso para ver este cliente')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar cliente. Intenta de nuevo.')
      }
      setClient(null)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  return {
    client,
    loading,
    error,
    refetch,
  }
}

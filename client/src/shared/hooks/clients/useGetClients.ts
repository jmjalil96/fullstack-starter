/**
 * Hook for fetching paginated list of clients with filters
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getClients } from '../../services/clientsApi'
import type { ClientListItemResponse, PaginationMetadata } from '../../types/clients'

/**
 * Return type for useGetClients hook
 */
interface UseGetClientsReturn {
  /** Array of clients */
  clients: ClientListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata | null
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch clients manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch paginated list of clients with optional filters
 *
 * Auto-fetches on mount and refetches when params change.
 * Returns clients based on current user's role and permissions.
 *
 * @param params - Optional query parameters (search, isActive, page, limit)
 * @returns {UseGetClientsReturn} Clients data, pagination, loading state, error, and refetch function
 *
 * @example
 * // Get all clients (first page, default limit)
 * const { clients, pagination, loading, error } = useGetClients()
 *
 * @example
 * // Filter by active status
 * const { clients, loading } = useGetClients({ isActive: true })
 *
 * @example
 * // With pagination
 * const [page, setPage] = useState(1)
 * const { clients, pagination } = useGetClients({ page, limit: 10 })
 *
 * @example
 * // Search by name/taxId/email
 * const { clients, loading } = useGetClients({ search: 'TechCorp' })
 */
export function useGetClients(params?: {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}): UseGetClientsReturn {
  const [clients, setClients] = useState<ClientListItemResponse[]>([])
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

    const fetchClients = async () => {
      setLoading(true)
      setError(null)
      // Keep current clients/pagination visible during load (smooth UX)

      try {
        const response = await getClients(params, { signal: controller.signal })
        // Replace data on success
        setClients(response.clients)
        setPagination(response.pagination)
      } catch (err) {
        // Ignore aborted requests (user changed params)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver clientes')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar clientes. Intenta de nuevo.')
        }
        // Clear data only on real errors
        setClients([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()

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
      const response = await getClients(params, { signal: controller.signal })
      setClients(response.clients)
      setPagination(response.pagination)
    } catch (err) {
      // Ignore aborted requests
      if ((err as Error).name === 'AbortError') {
        return
      }

      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver clientes')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar clientes. Intenta de nuevo.')
      }
      setClients([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return {
    clients,
    pagination,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching available clients for policy creation
 */

import { useCallback, useEffect, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAvailableClients } from '../../services/policiesApi'
import type { AvailableClientResponse } from '../../types/policies'

/**
 * Return type for useAvailableClients hook
 */
interface UseAvailableClientsReturn {
  /** Array of available clients */
  clients: AvailableClientResponse[]
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch clients manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch available clients for policy creation
 *
 * Auto-fetches on mount and provides refetch capability.
 * Returns clients based on current user's permissions.
 *
 * @returns {UseAvailableClientsReturn} Clients data, loading state, error, and refetch function
 *
 * @example
 * function NewPolicyForm() {
 *   const { clients, loading, error, refetch } = useAvailableClients()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *
 *   return (
 *     <select>
 *       {clients.map(client => (
 *         <option key={client.id} value={client.id}>
 *           {client.name}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 */
export function useAvailableClients(): UseAvailableClientsReturn {
  const [clients, setClients] = useState<AvailableClientResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch clients from API
   */
  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAvailableClients()
      setClients(data)
    } catch (err) {
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
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
  }
}

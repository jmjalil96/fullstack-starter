/**
 * Hook for fetching available insurers for policy creation
 */

import { useCallback, useEffect, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAvailableInsurers } from '../../services/policiesApi'
import type { AvailableInsurerResponse } from '../../types/policies'

/**
 * Return type for useAvailableInsurers hook
 */
interface UseAvailableInsurersReturn {
  /** Array of available insurers */
  insurers: AvailableInsurerResponse[]
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch insurers manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch available insurers for policy creation
 *
 * Auto-fetches on mount and provides refetch capability.
 * Returns active insurers with their codes.
 *
 * @returns {UseAvailableInsurersReturn} Insurers data, loading state, error, and refetch function
 *
 * @example
 * function NewPolicyForm() {
 *   const { insurers, loading, error, refetch } = useAvailableInsurers()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *
 *   return (
 *     <select>
 *       {insurers.map(insurer => (
 *         <option key={insurer.id} value={insurer.id}>
 *           {insurer.name} ({insurer.code})
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 */
export function useAvailableInsurers(): UseAvailableInsurersReturn {
  const [insurers, setInsurers] = useState<AvailableInsurerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch insurers from API
   */
  const fetchInsurers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAvailableInsurers()
      setInsurers(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver aseguradoras')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          // Use backend error message
          setError(err.message)
        }
      } else {
        // Generic fallback error
        setError('Error al cargar aseguradoras. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchInsurers()
  }, [fetchInsurers])

  return {
    insurers,
    loading,
    error,
    refetch: fetchInsurers,
  }
}

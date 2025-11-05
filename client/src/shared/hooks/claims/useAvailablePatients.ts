/**
 * Hook for fetching available patients for a specific affiliate
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getAvailablePatients } from '../../services/claimsApi'
import type { AvailablePatientResponse } from '../../types/claims'

/**
 * Return type for useAvailablePatients hook
 */
interface UseAvailablePatientsReturn {
  /** Array of available patients (affiliate + dependents) */
  patients: AvailablePatientResponse[]
  /** Loading state */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Refetch patients manually */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch available patients for a specific affiliate
 *
 * Fetches only when affiliateId is provided. Resets and refetches when affiliateId changes.
 * Returns the affiliate themselves (relationship: 'self') plus their dependents.
 *
 * @param affiliateId - Affiliate ID to fetch patients for (null/undefined to skip fetch)
 * @returns {UseAvailablePatientsReturn} Patients data, loading state, error, and refetch function
 *
 * @example
 * function NewClaimForm() {
 *   const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null)
 *   const { patients, loading, error } = useAvailablePatients(selectedAffiliate)
 *
 *   if (!selectedAffiliate) return <p>Selecciona un afiliado primero</p>
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *
 *   return (
 *     <select>
 *       {patients.map(patient => (
 *         <option key={patient.id} value={patient.id}>
 *           {patient.firstName} {patient.lastName}
 *           {patient.relationship === 'self' ? ' (Titular)' : ' (Dependiente)'}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 */
export function useAvailablePatients(
  affiliateId: string | null | undefined
): UseAvailablePatientsReturn {
  const [patients, setPatients] = useState<AvailablePatientResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-fetch when affiliateId changes (with AbortController)
  useEffect(() => {
    // Don't fetch if no affiliateId provided
    if (!affiliateId) {
      setPatients([])
      setLoading(false)
      setError(null)
      return
    }

    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchPatients = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getAvailablePatients(affiliateId, { signal: controller.signal })
        setPatients(data)
      } catch (err) {
        // Ignore aborted requests (user changed selection)
        if ((err as Error).name === 'AbortError') {
          return
        }

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver pacientes')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else if (err.statusCode === 404) {
            setError('Afiliado no encontrado')
          } else {
            // Use backend error message
            setError(err.message)
          }
        } else {
          // Generic fallback error
          setError('Error al cargar pacientes. Intenta de nuevo.')
        }
        // Clear patients on error
        setPatients([])
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()

    // Cleanup: abort request if affiliateId changes before completion
    return () => {
      controller.abort()
    }
  }, [affiliateId])

  /**
   * Manual refetch function (without AbortController)
   */
  const refetch = useCallback(async () => {
    if (!affiliateId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getAvailablePatients(affiliateId)
      setPatients(data)
    } catch (err) {
      // Handle API errors with Spanish messages
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver pacientes')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else if (err.statusCode === 404) {
          setError('Afiliado no encontrado')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar pacientes. Intenta de nuevo.')
      }
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [affiliateId])

  return {
    patients,
    loading,
    error,
    refetch,
  }
}

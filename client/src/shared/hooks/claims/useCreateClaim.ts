/**
 * Hook for creating a new claim (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { createClaim as createClaimAPI } from '../../services/claimsApi'
import type { CreateClaimRequest, CreateClaimResponse } from '../../types/claims'
import { useToast } from '../useToast'

/**
 * Return type for useCreateClaim hook
 */
interface UseCreateClaimReturn {
  /** Create claim function - call to submit */
  createClaim: (data: CreateClaimRequest) => Promise<CreateClaimResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Created claim data (null until successful) */
  data: CreateClaimResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to create a new claim
 *
 * Manual mutation hook - call createClaim() to submit.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling (navigation, etc.).
 *
 * @returns {UseCreateClaimReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function NewClaimForm() {
 *   const { createClaim, loading, error, data, reset } = useCreateClaim()
 *   const navigate = useNavigate()
 *
 *   const onSubmit = async (formData) => {
 *     try {
 *       const claim = await createClaim({
 *         clientId: formData.clientId,
 *         affiliateId: formData.affiliateId,
 *         patientId: formData.patientId,
 *         description: formData.description,
 *       })
 *
 *       // Success toast already shown
 *       navigate(`/reclamos/${claim.id}`)
 *     } catch (error) {
 *       // Error toast already shown
 *       // Error state available in hook.error
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Creando...' : 'Crear Reclamo'}
 *       </button>
 *     </form>
 *   )
 * }
 */
export function useCreateClaim(): UseCreateClaimReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CreateClaimResponse | null>(null)
  const toast = useToast()

  /**
   * Create claim mutation
   */
  const createClaim = useCallback(
    async (requestData: CreateClaimRequest): Promise<CreateClaimResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const claim = await createClaimAPI(requestData)
        setData(claim)
        setLoading(false)

        // Show success toast
        toast.success('Reclamo creado exitosamente')

        return claim
      } catch (err) {
        // Handle 401 separately - global interceptor + ProtectedRoute will handle
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          setLoading(false)
          throw err // Let global 401 interceptor + ProtectedRoute handle redirect/toast
        }

        let errorMessage = 'Error al crear reclamo. Intenta de nuevo.'

        // Handle API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para crear reclamos'
          } else if (err.statusCode === 400) {
            // Use backend validation error message
            errorMessage = err.message
          } else {
            // Use backend error message
            errorMessage = err.message
          }
        }

        setError(errorMessage)
        setLoading(false)

        // Show error toast
        toast.error(errorMessage)

        // Re-throw for component-level handling
        throw new Error(errorMessage)
      }
    },
    [toast]
  )

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    createClaim,
    loading,
    error,
    data,
    reset,
  }
}

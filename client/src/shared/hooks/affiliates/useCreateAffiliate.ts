/**
 * Hook for creating a new affiliate (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { createAffiliate as createAffiliateAPI } from '../../services/affiliatesApi'
import type { CreateAffiliateRequest, CreateAffiliateResponse } from '../../types/affiliates'
import { useToast } from '../useToast'

/**
 * Return type for useCreateAffiliate hook
 */
interface UseCreateAffiliateReturn {
  /** Create affiliate function - call to submit */
  createAffiliate: (data: CreateAffiliateRequest) => Promise<CreateAffiliateResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Created affiliate data (null until successful) */
  data: CreateAffiliateResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to create a new affiliate
 *
 * Manual mutation hook - call createAffiliate() to submit.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling (navigation, etc.).
 *
 * @returns {UseCreateAffiliateReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function NewAffiliateForm() {
 *   const { createAffiliate, loading, error, data, reset } = useCreateAffiliate()
 *   const navigate = useNavigate()
 *
 *   const onSubmit = async (formData) => {
 *     try {
 *       const affiliate = await createAffiliate({
 *         clientId: formData.clientId,
 *         firstName: formData.firstName,
 *         lastName: formData.lastName,
 *         email: formData.email,
 *         affiliateType: formData.affiliateType,
 *         coverageType: formData.coverageType,
 *       })
 *
 *       // Success toast already shown
 *       navigate(`/afiliados/${affiliate.id}`)
 *     } catch (error) {
 *       // Error toast already shown
 *       // Error state available in hook.error
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Creando...' : 'Crear Afiliado'}
 *       </button>
 *     </form>
 *   )
 * }
 */
export function useCreateAffiliate(): UseCreateAffiliateReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CreateAffiliateResponse | null>(null)
  const toast = useToast()

  /**
   * Create affiliate mutation
   */
  const createAffiliate = useCallback(
    async (requestData: CreateAffiliateRequest): Promise<CreateAffiliateResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const affiliate = await createAffiliateAPI(requestData)
        setData(affiliate)
        setLoading(false)

        // Show success toast
        toast.success('Afiliado creado exitosamente')

        return affiliate
      } catch (err) {
        // Handle 401 separately - global interceptor + ProtectedRoute will handle
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          setLoading(false)
          throw err // Let global 401 interceptor + ProtectedRoute handle redirect/toast
        }

        // Handle validation errors (400 with metadata.issues) - let form handle field mapping
        if (
          err instanceof ApiRequestError &&
          err.statusCode === 400 &&
          err.metadata?.issues
        ) {
          setLoading(false)
          throw err // Let form map issues to fields, no toast/error state here
        }

        let errorMessage = 'Error al crear afiliado. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para crear afiliados'
          } else if (err.statusCode === 409) {
            // Duplicate document or other conflict
            errorMessage = err.message
          } else if (err.statusCode === 400) {
            // Non-validation 400 errors
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

        // Re-throw original error to preserve metadata
        throw err
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
    createAffiliate,
    loading,
    error,
    data,
    reset,
  }
}

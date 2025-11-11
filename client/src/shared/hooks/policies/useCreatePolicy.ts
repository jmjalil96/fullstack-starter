/**
 * Hook for creating a new policy (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { createPolicy as createPolicyAPI } from '../../services/policiesApi'
import type { CreatePolicyRequest, CreatePolicyResponse } from '../../types/policies'
import { useToast } from '../useToast'

/**
 * Return type for useCreatePolicy hook
 */
interface UseCreatePolicyReturn {
  /** Create policy function - call to submit */
  createPolicy: (data: CreatePolicyRequest) => Promise<CreatePolicyResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Created policy data (null until successful) */
  data: CreatePolicyResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to create a new policy
 *
 * Manual mutation hook - call createPolicy() to submit.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling (navigation, etc.).
 *
 * @returns {UseCreatePolicyReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function NewPolicyForm() {
 *   const { createPolicy, loading, error, data, reset } = useCreatePolicy()
 *   const navigate = useNavigate()
 *
 *   const onSubmit = async (formData) => {
 *     try {
 *       const policy = await createPolicy({
 *         policyNumber: formData.policyNumber,
 *         clientId: formData.clientId,
 *         insurerId: formData.insurerId,
 *         type: formData.type,
 *         startDate: formData.startDate,
 *         endDate: formData.endDate,
 *       })
 *
 *       // Success toast already shown
 *       navigate(`/clientes/polizas/${policy.id}`)
 *     } catch (error) {
 *       // Error toast already shown
 *       // Error state available in hook.error
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Creando...' : 'Crear Póliza'}
 *       </button>
 *     </form>
 *   )
 * }
 */
export function useCreatePolicy(): UseCreatePolicyReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CreatePolicyResponse | null>(null)
  const toast = useToast()

  /**
   * Create policy mutation
   */
  const createPolicy = useCallback(
    async (requestData: CreatePolicyRequest): Promise<CreatePolicyResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const policy = await createPolicyAPI(requestData)
        setData(policy)
        setLoading(false)

        // Show success toast
        toast.success('Póliza creada exitosamente')

        return policy
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

        let errorMessage = 'Error al crear póliza. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para crear pólizas'
          } else if (err.statusCode === 409) {
            // Duplicate policyNumber
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
    createPolicy,
    loading,
    error,
    data,
    reset,
  }
}

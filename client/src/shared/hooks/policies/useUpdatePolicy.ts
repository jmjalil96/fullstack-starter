/**
 * Hook for updating a policy (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { updatePolicy as updatePolicyAPI } from '../../services/policiesApi'
import type { PolicyDetailResponse, UpdatePolicyRequest } from '../../types/policies'
import { useToast } from '../useToast'

/**
 * Options for useUpdatePolicy hook
 */
interface UseUpdatePolicyOptions {
  /** Callback fired after successful update */
  onSuccess?: (policy: PolicyDetailResponse) => void
  /** Callback fired after failed update */
  onError?: (error: Error) => void
}

/**
 * Return type for useUpdatePolicy hook
 */
interface UseUpdatePolicyReturn {
  /** Update policy function - call to submit changes */
  updatePolicy: (
    policyId: string,
    updates: UpdatePolicyRequest,
    options?: RequestInit
  ) => Promise<PolicyDetailResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Updated policy data (null until successful) */
  data: PolicyDetailResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to update a policy
 *
 * Manual mutation hook - call updatePolicy() to submit changes.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling.
 *
 * @param options - Optional configuration (onSuccess, onError callbacks)
 * @returns {UseUpdatePolicyReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function EditPolicyModal({ policy, onClose }) {
 *   const { updatePolicy, loading, error } = useUpdatePolicy({
 *     onSuccess: (updated) => {
 *       onClose()
 *       refetchPolicyDetail()
 *     }
 *   })
 *
 *   const onSubmit = async (formData) => {
 *     const controller = new AbortController()
 *
 *     try {
 *       await updatePolicy(policy.id, {
 *         type: formData.type,
 *         ambCopay: formData.ambCopay,
 *         tPremium: formData.tPremium,
 *       }, { signal: controller.signal })
 *       // Success toast already shown
 *       // onSuccess already called
 *     } catch (error) {
 *       // Error toast already shown (if applicable)
 *       // Error state available in hook.error
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Guardando...' : 'Guardar Cambios'}
 *       </button>
 *     </form>
 *   )
 * }
 */
export function useUpdatePolicy(options?: UseUpdatePolicyOptions): UseUpdatePolicyReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PolicyDetailResponse | null>(null)
  const toast = useToast()

  /**
   * Update policy mutation
   */
  const updatePolicy = useCallback(
    async (
      policyId: string,
      updates: UpdatePolicyRequest,
      requestOptions?: RequestInit
    ): Promise<PolicyDetailResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const policy = await updatePolicyAPI(policyId, updates, requestOptions)
        setData(policy)
        setLoading(false)

        // Show success toast
        toast.success('Póliza actualizada exitosamente')

        // Call onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess(policy)
        }

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

        let errorMessage = 'Error al actualizar póliza. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            errorMessage = 'Póliza no encontrada'
          } else if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para editar esta póliza'
          } else if (err.statusCode === 409) {
            // Duplicate policyNumber
            errorMessage = err.message
          } else if (err.statusCode === 400) {
            // Non-validation 400 errors (e.g., lifecycle errors)
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

        // Call onError callback if provided
        options?.onError?.(err as Error)

        // Re-throw original error to preserve metadata
        throw err
      }
    },
    [toast, options]
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
    updatePolicy,
    loading,
    error,
    data,
    reset,
  }
}

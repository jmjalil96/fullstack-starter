/**
 * Hook for updating a claim (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { updateClaim as updateClaimAPI } from '../../services/claimsApi'
import type { ClaimDetailResponse, ClaimUpdateRequest } from '../../types/claims'
import { useToast } from '../useToast'

/**
 * Options for useUpdateClaim hook
 */
interface UseUpdateClaimOptions {
  /** Callback fired after successful update */
  onSuccess?: (claim: ClaimDetailResponse) => void
  /** Callback fired after failed update */
  onError?: (error: Error) => void
}

/**
 * Return type for useUpdateClaim hook
 */
interface UseUpdateClaimReturn {
  /** Update claim function - call to submit changes */
  updateClaim: (
    claimId: string,
    updates: ClaimUpdateRequest,
    options?: RequestInit
  ) => Promise<ClaimDetailResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Updated claim data (null until successful) */
  data: ClaimDetailResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to update a claim
 *
 * Manual mutation hook - call updateClaim() to submit changes.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling.
 *
 * @param options - Optional configuration (onSuccess, onError callbacks)
 * @returns {UseUpdateClaimReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function EditClaimModal({ claim, onClose }) {
 *   const { updateClaim, loading, error } = useUpdateClaim({
 *     onSuccess: (updated) => {
 *       onClose()
 *       refetchClaimDetail()
 *     }
 *   })
 *
 *   const onSubmit = async (formData) => {
 *     const controller = new AbortController()
 *
 *     try {
 *       await updateClaim(claim.id, {
 *         description: formData.description,
 *         amount: formData.amount,
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
export function useUpdateClaim(options?: UseUpdateClaimOptions): UseUpdateClaimReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ClaimDetailResponse | null>(null)
  const toast = useToast()

  /**
   * Update claim mutation
   */
  const updateClaim = useCallback(
    async (
      claimId: string,
      updates: ClaimUpdateRequest,
      requestOptions?: RequestInit
    ): Promise<ClaimDetailResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const claim = await updateClaimAPI(claimId, updates, requestOptions)
        setData(claim)
        setLoading(false)

        // Show success toast
        toast.success('Reclamo actualizado exitosamente')

        // Call onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess(claim)
        }

        return claim
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

        let errorMessage = 'Error al actualizar reclamo. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            errorMessage = 'Reclamo no encontrado'
          } else if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para editar este reclamo'
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
    updateClaim,
    loading,
    error,
    data,
    reset,
  }
}

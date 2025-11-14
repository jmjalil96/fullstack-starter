/**
 * Hook for updating an affiliate (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { updateAffiliate as updateAffiliateAPI } from '../../services/affiliatesApi'
import type { AffiliateDetailResponse, UpdateAffiliateRequest } from '../../types/affiliates'
import { useToast } from '../useToast'

/**
 * Options for useUpdateAffiliate hook
 */
interface UseUpdateAffiliateOptions {
  /** Callback fired after successful update */
  onSuccess?: (affiliate: AffiliateDetailResponse) => void
  /** Callback fired after failed update */
  onError?: (error: Error) => void
}

/**
 * Return type for useUpdateAffiliate hook
 */
interface UseUpdateAffiliateReturn {
  /** Update affiliate function - call to submit changes */
  updateAffiliate: (
    affiliateId: string,
    updates: UpdateAffiliateRequest,
    options?: RequestInit
  ) => Promise<AffiliateDetailResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Updated affiliate data (null until successful) */
  data: AffiliateDetailResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to update an affiliate
 *
 * Manual mutation hook - call updateAffiliate() to submit changes.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling.
 *
 * @param options - Optional configuration (onSuccess, onError callbacks)
 * @returns {UseUpdateAffiliateReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function EditAffiliateModal({ affiliate, onClose }) {
 *   const { updateAffiliate, loading, error } = useUpdateAffiliate({
 *     onSuccess: (updated) => {
 *       onClose()
 *       refetchAffiliateDetail()
 *     }
 *   })
 *
 *   const onSubmit = async (formData) => {
 *     const controller = new AbortController()
 *
 *     try {
 *       await updateAffiliate(affiliate.id, {
 *         firstName: formData.firstName,
 *         lastName: formData.lastName,
 *         phone: formData.phone,
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
export function useUpdateAffiliate(options?: UseUpdateAffiliateOptions): UseUpdateAffiliateReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AffiliateDetailResponse | null>(null)
  const toast = useToast()

  /**
   * Update affiliate mutation
   */
  const updateAffiliate = useCallback(
    async (
      affiliateId: string,
      updates: UpdateAffiliateRequest,
      requestOptions?: RequestInit
    ): Promise<AffiliateDetailResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const affiliate = await updateAffiliateAPI(affiliateId, updates, requestOptions)
        setData(affiliate)
        setLoading(false)

        // Show success toast
        toast.success('Afiliado actualizado exitosamente')

        // Call onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess(affiliate)
        }

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

        let errorMessage = 'Error al actualizar afiliado. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            errorMessage = 'Afiliado no encontrado'
          } else if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para editar este afiliado'
          } else if (err.statusCode === 409) {
            // Duplicate document number or other conflicts
            errorMessage = err.message
          } else if (err.statusCode === 400) {
            // Non-validation 400 errors (e.g., business rule violations)
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
    updateAffiliate,
    loading,
    error,
    data,
    reset,
  }
}

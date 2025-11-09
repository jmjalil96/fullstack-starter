/**
 * Hook for updating a client (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { updateClient as updateClientAPI } from '../../services/clientsApi'
import type { UpdateClientRequest, UpdateClientResponse } from '../../types/clients'
import { useToast } from '../useToast'

/**
 * Options for useUpdateClient hook
 */
interface UseUpdateClientOptions {
  /** Callback after successful update */
  onSuccess?: () => void
  /** Callback after failed update */
  onError?: (error: Error) => void
}

/**
 * Return type for useUpdateClient hook
 */
interface UseUpdateClientReturn {
  /** Update client function - call to submit */
  updateClient: (clientId: string, updates: UpdateClientRequest) => Promise<UpdateClientResponse>
  /** Loading state during update */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Updated client data (null until successful) */
  data: UpdateClientResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to update a client
 *
 * Manual mutation hook - call updateClient() to submit.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling (form field mapping, etc.).
 * Supports onSuccess/onError callbacks for side effects.
 *
 * @param options - Optional callbacks (onSuccess, onError)
 * @returns {UseUpdateClientReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * // With callbacks
 * const { updateClient, loading } = useUpdateClient({
 *   onSuccess: () => {
 *     closeModal()
 *     refetchClient()
 *   }
 * })
 *
 * const onSubmit = async (formData) => {
 *   try {
 *     await updateClient('client-123', {
 *       name: formData.name,
 *       email: formData.email
 *     })
 *     // onSuccess already called
 *   } catch (error) {
 *     // Error toast already shown
 *   }
 * }
 *
 * @example
 * // Without callbacks
 * const { updateClient, loading, error } = useUpdateClient()
 */
export function useUpdateClient(
  options?: UseUpdateClientOptions
): UseUpdateClientReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<UpdateClientResponse | null>(null)
  const toast = useToast()

  /**
   * Update client mutation
   */
  const updateClient = useCallback(
    async (
      clientId: string,
      updates: UpdateClientRequest
    ): Promise<UpdateClientResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null)
      setLoading(true)

      try {
        const client = await updateClientAPI(clientId, updates)
        setData(client)
        setLoading(false)

        // Show success toast
        toast.success('Cliente actualizado exitosamente')

        // Call onSuccess callback if provided
        options?.onSuccess?.()

        return client
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

        let errorMessage = 'Error al actualizar cliente. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 404) {
            errorMessage = 'Cliente no encontrado'
          } else if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para editar clientes'
          } else if (err.statusCode === 409) {
            // Duplicate taxId conflict
            errorMessage = err.message // Backend already has good Spanish message
          } else if (err.statusCode === 400) {
            // Non-validation 400 errors (empty update, etc.)
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
    updateClient,
    loading,
    error,
    data,
    reset,
  }
}

/**
 * Hook for creating a new client (mutation)
 */

import { useCallback, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { createClient as createClientAPI } from '../../services/clientsApi'
import type { CreateClientRequest, CreateClientResponse } from '../../types/clients'
import { useToast } from '../useToast'

/**
 * Return type for useCreateClient hook
 */
interface UseCreateClientReturn {
  /** Create client function - call to submit */
  createClient: (data: CreateClientRequest) => Promise<CreateClientResponse>
  /** Loading state during submission */
  loading: boolean
  /** Error message (Spanish) */
  error: string | null
  /** Created client data (null until successful) */
  data: CreateClientResponse | null
  /** Reset hook state (clear error, data, loading) */
  reset: () => void
}

/**
 * Hook to create a new client
 *
 * Manual mutation hook - call createClient() to submit.
 * Shows success/error toasts automatically.
 * Re-throws errors for component-level handling (form field mapping, etc.).
 *
 * @returns {UseCreateClientReturn} Mutation function, loading state, error, data, and reset
 *
 * @example
 * function CreateClientModal() {
 *   const { createClient, loading, error, data, reset } = useCreateClient()
 *
 *   const onSubmit = async (formData) => {
 *     try {
 *       const client = await createClient({
 *         name: formData.name,
 *         taxId: formData.taxId,
 *         email: formData.email,
 *         phone: formData.phone,
 *         address: formData.address,
 *       })
 *
 *       // Success toast already shown
 *       onClose()
 *       refetchList()
 *     } catch (error) {
 *       // Error toast already shown
 *       // Error state available in hook.error
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Creando...' : 'Crear Cliente'}
 *       </button>
 *     </form>
 *   )
 * }
 */
export function useCreateClient(): UseCreateClientReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CreateClientResponse | null>(null)
  const toast = useToast()

  /**
   * Create client mutation
   */
  const createClient = useCallback(
    async (requestData: CreateClientRequest): Promise<CreateClientResponse> => {
      // Clear previous error and data on retry
      setError(null)
      setData(null) // Clear previous result before retry
      setLoading(true)

      try {
        const client = await createClientAPI(requestData)
        setData(client)
        setLoading(false)

        // Show success toast
        toast.success('Cliente creado exitosamente')

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

        let errorMessage = 'Error al crear cliente. Intenta de nuevo.'

        // Handle other API errors with Spanish messages
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            errorMessage = 'No tienes permiso para crear clientes'
          } else if (err.statusCode === 409) {
            // Duplicate taxId conflict
            errorMessage = err.message // Backend already has good Spanish message
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
    createClient,
    loading,
    error,
    data,
    reset,
  }
}

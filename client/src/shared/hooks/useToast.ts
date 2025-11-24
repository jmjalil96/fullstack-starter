import { useContext } from 'react'

import { ToastContext, type ToastContextValue } from '../../providers/ToastProvider'

/**
 * Hook to access toast notifications
 *
 * @throws Error if used outside ToastProvider
 *
 * @example
 * function MyComponent() {
 *   const toast = useToast()
 *
 *   const handleSuccess = () => {
 *     toast.success('Action completed!')
 *   }
 *
 *   const handleError = () => {
 *     toast.error('Something went wrong')
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>Success</button>
 *       <button onClick={handleError}>Error</button>
 *     </div>
 *   )
 * }
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

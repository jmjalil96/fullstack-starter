import { type ReactNode, useEffect } from 'react'

import { useAuthStore } from '../../store/authStore'

import { Spinner } from './ui/feedback/Spinner'

/**
 * AuthInitializer - Checks session on app mount
 *
 * Shows loading spinner until session check completes.
 * Wraps app content to ensure auth state is loaded before rendering.
 *
 * @example
 * <AuthInitializer>
 *   <App />
 * </AuthInitializer>
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    // Check session on mount - use getState() to avoid subscription
    useAuthStore.getState().checkSession()
  }, [])

  // Show loading spinner until session check completes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Spinner size="xl" className="mb-4 mx-auto" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

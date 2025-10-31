import { type ReactNode, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthGuard } from '../hooks/useAuthGuard'
import { useToast } from '../hooks/useToast'

import { Spinner } from './ui/Spinner'

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Protected content to render if authenticated */
  children: ReactNode
  /** Where to redirect if not authenticated (default: '/login') */
  redirectTo?: string
  /** Toast message to show on redirect (default: 'Please log in...') */
  message?: string
}

/**
 * ProtectedRoute - Enforces authentication on routes
 *
 * Wraps route content and only renders it if user is authenticated.
 * Shows loading state while checking, redirects with toast if not authenticated.
 *
 * @example
 * // Basic protection
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 *
 * @example
 * // Custom redirect target
 * <Route path="/admin" element={
 *   <ProtectedRoute redirectTo="/login">
 *     <AdminPanel />
 *   </ProtectedRoute>
 * } />
 *
 * @example
 * // Custom message
 * <Route path="/premium" element={
 *   <ProtectedRoute message="Premium feature requires login">
 *     <PremiumFeature />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  message = 'Please log in to access this page',
}: ProtectedRouteProps) {
  const guard = useAuthGuard()
  const toast = useToast()
  const hasShownToast = useRef(false)

  // Show toast when redirecting (only once)
  useEffect(() => {
    if (guard.needsAuth && !hasShownToast.current) {
      toast.info(message)
      hasShownToast.current = true
    }

    // Reset when user gains access
    if (guard.canAccess) {
      hasShownToast.current = false
    }
  }, [guard.needsAuth, guard.canAccess, message, toast])

  // Still checking authentication status
  if (guard.isChecking) {
    return <LoadingScreen />
  }

  // User needs to authenticate
  if (guard.needsAuth) {
    return <Navigate to={redirectTo} replace />
  }

  // User is authenticated - render protected content
  if (guard.canAccess) {
    return <>{children}</>
  }

  // Fallback (should never reach here)
  return <Navigate to={redirectTo} replace />
}

/**
 * Full-page loading screen while checking authentication
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Spinner size="xl" className="mb-4 mx-auto" label="Checking authentication" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  )
}

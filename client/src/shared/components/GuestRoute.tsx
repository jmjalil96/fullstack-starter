import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthGuard } from '../hooks/useAuthGuard'

import { Spinner } from './ui/feedback/Spinner'

/**
 * Props for GuestRoute component
 */
interface GuestRouteProps {
  /** Content to render if user is NOT authenticated */
  children: ReactNode
  /** Where to redirect if authenticated (default: '/dashboard') */
  redirectTo?: string
}

/**
 * GuestRoute - Redirects authenticated users away from guest-only pages
 *
 * Inverse of ProtectedRoute. Use for auth pages (login, signup, etc.)
 * that should not be accessible to already-logged-in users.
 *
 * @example
 * <Route path="/login" element={
 *   <GuestRoute>
 *     <Login />
 *   </GuestRoute>
 * } />
 *
 * @example
 * // Custom redirect target
 * <Route path="/signup" element={
 *   <GuestRoute redirectTo="/onboarding">
 *     <Signup />
 *   </GuestRoute>
 * } />
 */
export function GuestRoute({ children, redirectTo = '/dashboard' }: GuestRouteProps) {
  const { isAuthenticated, isChecking } = useAuthGuard()

  // Still checking authentication status
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner size="xl" />
      </div>
    )
  }

  // User is authenticated - redirect away from guest page
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // User is not authenticated - render guest content
  return <>{children}</>
}

import { useAuthStore } from '../../store/authStore'
import type { User } from '../types/auth'

/**
 * Auth guard result with access decisions
 */
export interface AuthGuardResult {
  /** Can the user access the resource? */
  canAccess: boolean
  /** Does the user need to authenticate? */
  needsAuth: boolean
  /** Is authentication status still being checked? */
  isChecking: boolean
  /** Current user (null if not authenticated) */
  user: User | null
  /** Is user authenticated? */
  isAuthenticated: boolean
  /** Auth check error (if any) */
  error: string | null
}

/**
 * Auth Guard Hook - Centralized authentication checking logic
 *
 * Checks if a user can access protected resources based on authentication state.
 * Separates logic from UI - doesn't handle redirects or display, just returns decisions.
 *
 * @returns AuthGuardResult with access decisions and user info
 *
 * @example
 * // Basic usage in ProtectedRoute
 * const guard = useAuthGuard()
 * if (guard.canAccess) return <ProtectedPage />
 *
 * @example
 * // Conditional rendering in components
 * const guard = useAuthGuard()
 * {guard.isAuthenticated && <LogoutButton />}
 *
 * @example
 * // Show loading while checking
 * const guard = useAuthGuard()
 * if (guard.isChecking) return <Spinner />
 *
 * @example
 * // Access user data
 * const guard = useAuthGuard()
 * <p>Welcome, {guard.user?.name}</p>
 */
export function useAuthGuard(): AuthGuardResult {
  const { user, isAuthenticated, isInitialized, error } = useAuthStore()

  // Derive access decisions from store state
  const canAccess = isInitialized && isAuthenticated
  const needsAuth = isInitialized && !isAuthenticated
  const isChecking = !isInitialized

  return {
    canAccess,
    needsAuth,
    isChecking,
    user,
    isAuthenticated,
    error,
  }
}

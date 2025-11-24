import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { ApiRequestError, fetchAPI, registerUnauthorizedHandler } from '../config/api'
import { queryClient } from '../config/queryClient'
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SessionResponse,
  SignInRequest,
  SignUpRequest,
  User,
} from '../shared/types/auth'

/**
 * Auth store state and actions
 */
interface AuthStore {
  // State
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  isLoading: boolean
  isAuthenticating: boolean
  error: string | null

  // Actions
  checkSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

/**
 * Initial state
 */
const initialState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  isAuthenticating: false,
  error: null,
}

/**
 * Zustand Auth Store - Manages authentication state
 *
 * @example
 * // Check authentication status
 * const { isAuthenticated, user } = useAuthStore()
 *
 * @example
 * // Sign in
 * const { signIn, isAuthenticating, error } = useAuthStore()
 * await signIn(email, password)
 *
 * @example
 * // Sign out
 * const { signOut } = useAuthStore()
 * await signOut()
 *
 * @example
 * // Check session on app init
 * useEffect(() => {
 *   useAuthStore.getState().checkSession()
 * }, [])
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      /**
       * Check current session with backend
       * Called on app initialization and after login/logout
       */
      checkSession: async () => {
        // Don't check if already checking
        if (get().isLoading) return

        set({ isLoading: true, error: null })

        try {
          const response = await fetchAPI<SessionResponse>('/api/auth/get-session')

          set({
            user: response.user,
            isAuthenticated: !!response.user,
            isInitialized: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          // Session check failed - assume not authenticated
          // This is expected when user is not logged in (401/403)
          // Only log in development for debugging
          if (import.meta.env.DEV) {
            console.error('Session check failed:', error)
          }

          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: null, // Don't show errors for session checks - it's a background operation
          })
        }
      },

      /**
       * Sign in with email and password
       * On success, automatically checks session to get user data
       *
       * @throws ApiRequestError if login fails
       */
      signIn: async (email: string, password: string) => {
        set({ isAuthenticating: true, error: null })

        try {
          const body: SignInRequest = { email, password }

          await fetchAPI('/api/auth/sign-in/email', {
            method: 'POST',
            body: JSON.stringify(body),
          })

          // After successful login, check session to get user data
          await get().checkSession()

          set({ isAuthenticating: false })
        } catch (error) {
          let errorMessage = 'Inicio de sesión falló. Intenta de nuevo.'

          if (error instanceof ApiRequestError) {
            // Handle specific error cases
            if (error.statusCode === 401) {
              errorMessage = 'Correo o contraseña inválidos'
            } else if (error.statusCode === 403) {
              errorMessage = 'Por favor verifica tu correo electrónico'
            } else {
              errorMessage = error.message
            }
          }

          set({
            isAuthenticating: false,
            error: errorMessage,
          })

          // Re-throw for component-level handling
          throw new Error(errorMessage)
        }
      },

      /**
       * Sign up with name, email, and password
       * On success, automatically checks session (BetterAuth auto-logs in after signup)
       *
       * @throws ApiRequestError if signup fails
       */
      signUp: async (name: string, email: string, password: string) => {
        set({ isAuthenticating: true, error: null })

        try {
          const body: SignUpRequest = { name, email, password }

          await fetchAPI('/api/auth/sign-up/email', {
            method: 'POST',
            body: JSON.stringify(body),
          })

          // After successful signup, check session to get user data
          // BetterAuth automatically logs in user after signup
          await get().checkSession()

          set({ isAuthenticating: false })
        } catch (error) {
          let errorMessage = 'Registro falló. Intenta de nuevo.'

          if (error instanceof ApiRequestError) {
            // Handle specific error cases
            if (error.statusCode === 400) {
              errorMessage = 'El correo ya está en uso'
            } else if (error.statusCode === 422) {
              errorMessage = 'Entrada inválida. Verifica tus datos.'
            } else {
              errorMessage = error.message
            }
          }

          set({
            isAuthenticating: false,
            error: errorMessage,
          })

          // Re-throw for component-level handling
          throw new Error(errorMessage)
        }
      },

      /**
       * Sign out current user
       * Clears session on backend and local state
       */
      signOut: async () => {
        set({ isAuthenticating: true })

        try {
          await fetchAPI('/api/auth/sign-out', {
            method: 'POST',
          })

          // Clear TanStack Query cache to prevent stale data after logout
          queryClient.clear()

          // Clear local state
          set({
            user: null,
            isAuthenticated: false,
            isAuthenticating: false,
            error: null,
          })
        } catch (error) {
          // Even if API call fails, clear local state
          // User wanted to log out, so honor that
          console.error('Logout error:', error)

          // Clear cache even on error
          queryClient.clear()

          set({
            user: null,
            isAuthenticated: false,
            isAuthenticating: false,
            error: null,
          })
        }
      },

      /**
       * Request password reset email
       * Sends reset link to user's email address
       *
       * @throws ApiRequestError if request fails
       */
      requestPasswordReset: async (email: string) => {
        set({ isAuthenticating: true, error: null })

        try {
          const body: ForgotPasswordRequest = { email }

          await fetchAPI('/api/auth/forget-password', {
            method: 'POST',
            body: JSON.stringify(body),
          })

          // Success - email sent (always succeeds for security)
          set({ isAuthenticating: false })
        } catch (error) {
          let errorMessage = 'No se pudo enviar el correo. Intenta de nuevo.'

          if (error instanceof ApiRequestError) {
            errorMessage = error.message
          }

          set({
            isAuthenticating: false,
            error: errorMessage,
          })

          // Re-throw for component-level handling
          throw new Error(errorMessage)
        }
      },

      /**
       * Reset password with token
       * Completes password reset flow
       *
       * @throws ApiRequestError if reset fails
       */
      resetPassword: async (token: string, newPassword: string) => {
        set({ isAuthenticating: true, error: null })

        try {
          const body: ResetPasswordRequest = { token, newPassword }

          await fetchAPI('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(body),
          })

          // Success - password reset
          set({ isAuthenticating: false })
        } catch (error) {
          let errorMessage = 'No se pudo restablecer la contraseña.'

          if (error instanceof ApiRequestError) {
            // Handle specific error cases
            if (error.statusCode === 400) {
              errorMessage = 'Enlace inválido o expirado'
            } else {
              errorMessage = error.message
            }
          }

          set({
            isAuthenticating: false,
            error: errorMessage,
          })

          // Re-throw for component-level handling
          throw new Error(errorMessage)
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Reset store to initial state
       * Useful for testing or cleanup
       */
      reset: () => {
        set(initialState)
      },
    }),
    { name: 'AuthStore' } // DevTools name
  )
)

// Register global 401 handler
// When any API call gets 401, clear auth state → ProtectedRoute will redirect
registerUnauthorizedHandler(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isInitialized: true,
    isLoading: false,
    isAuthenticating: false,
    error: null,
  })
})

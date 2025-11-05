import type { ApiError } from '../shared/types/auth'

/**
 * API Configuration
 */

// API base URL from environment variable
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  statusCode?: number
  code?: string

  constructor(message: string, statusCode?: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * Global 401 unauthorized handler
 * Registered by authStore to clear auth state on session expiration
 */
let onUnauthorized: (() => void) | null = null

/**
 * Register a callback to handle 401 unauthorized responses
 * Called by authStore on initialization
 *
 * @param cb - Callback to execute when 401 is received
 */
export function registerUnauthorizedHandler(cb: () => void) {
  onUnauthorized = cb
}

/**
 * Type-safe fetch wrapper for API calls
 *
 * Supports all standard RequestInit options including AbortController signal.
 *
 * @example
 * const user = await fetchAPI<User>('/api/users/me')
 *
 * @example
 * await fetchAPI('/api/auth/sign-out', { method: 'POST' })
 *
 * @example
 * const data = await fetchAPI<SessionResponse>('/api/auth/get-session')
 *
 * @example
 * // With AbortController for cancellation
 * const controller = new AbortController()
 * const data = await fetchAPI('/api/data', { signal: controller.signal })
 * // Later: controller.abort()
 */
export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Default options
  const config: RequestInit = {
    ...options, // Spread first (preserves signal, method, body, etc.)
    credentials: 'include', // Override to always include cookies for sessions
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}), // Merge any custom headers
    },
  }

  try {
    const response = await fetch(url, config)

    // Handle non-JSON responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    // Parse response body
    const data = await response.json()

    // Handle error responses
    if (!response.ok) {
      const error = data as ApiError

      // Intercept 401 only → session expired
      if (response.status === 401) {
        onUnauthorized?.()
      }

      throw new ApiRequestError(
        error.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        error.code
      )
    }

    return data as T
  } catch (error) {
    // Let aborted requests bubble up so hooks can ignore them
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }

    // Network errors (server down, no internet, etc.)
    if (error instanceof TypeError) {
      throw new ApiRequestError('Unable to connect to server. Please check your connection.')
    }

    // Re-throw API errors
    if (error instanceof ApiRequestError) {
      throw error
    }

    // Unknown errors
    throw new ApiRequestError('An unexpected error occurred')
  }
}

/**
 * Auth types matching BetterAuth backend
 */

/**
 * User object from BetterAuth
 * Matches backend: api/src/types/express.d.ts
 */
export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string | null
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

/**
 * BetterAuth session object
 */
export interface Session {
  id: string
  userId: string
  expiresAt: string // ISO date string
  createdAt: string
  updatedAt: string
}

/**
 * Response from GET /api/auth/get-session
 */
export interface SessionResponse {
  user: User | null
  session: Session | null
}

/**
 * Request body for POST /api/auth/sign-in/email
 */
export interface SignInRequest {
  email: string
  password: string
}

/**
 * Response from POST /api/auth/sign-in/email
 */
export interface SignInResponse {
  user: User
  session: Session
}

/**
 * Request body for POST /api/auth/sign-up/email
 */
export interface SignUpRequest {
  email: string
  password: string
  name: string
}

/**
 * Response from POST /api/auth/sign-up/email
 */
export interface SignUpResponse {
  user: User
  session: Session
}

/**
 * Request body for POST /api/auth/forget-password
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * Request body for POST /api/auth/reset-password
 */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * Generic API error response
 */
export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
  metadata?: Record<string, unknown>
}

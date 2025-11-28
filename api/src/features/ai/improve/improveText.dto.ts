/**
 * DTOs for improving text with AI (POST /api/ai/improve-text)
 */

/**
 * Request body for improving text
 *
 * Authorization:
 * - Any authenticated user can improve text
 *
 * Validation:
 * - text: required, 1-5000 chars
 * - context: optional, defaults to 'support-reply'
 *
 * @example
 * {
 *   "text": "hola necesito ayuda con mi factura",
 *   "context": "support-reply"
 * }
 */
export interface ImproveTextRequest {
  /** Text to improve (required) */
  text: string

  /** Context for improvement style (optional, defaults to support-reply) */
  context?: 'support-reply' | 'general'
}

/**
 * Response from POST /api/ai/improve-text
 *
 * Returns the improved version of the input text.
 */
export interface ImproveTextResponse {
  /** Improved text with corrected grammar and professional tone */
  improved: string
}

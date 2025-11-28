/**
 * AI feature types
 */

/**
 * Context for text improvement
 */
export type ImproveTextContext = 'support-reply' | 'general'

/**
 * Request for improving text with AI
 */
export interface ImproveTextRequest {
  /** Text to improve */
  text: string
  /** Context for improvement style */
  context?: ImproveTextContext
}

/**
 * Response from text improvement
 */
export interface ImproveTextResponse {
  /** Improved text */
  improved: string
}

/**
 * AI API service layer
 * Type-safe wrappers around fetchAPI for AI endpoints
 */

import { fetchAPI } from '../../config/api'

import type { ImproveTextRequest, ImproveTextResponse } from './ai'

/**
 * Improve text using AI
 *
 * Sends text to the backend which uses OpenRouter to correct grammar
 * and make the text more professional.
 *
 * @param data - Text and context for improvement
 * @returns Improved text
 *
 * @example
 * const response = await improveText({
 *   text: 'hola necesito ayuda con mi factura',
 *   context: 'support-reply'
 * })
 * // Returns: { improved: 'Hola, necesito ayuda con mi factura, por favor.' }
 */
export async function improveText(data: ImproveTextRequest): Promise<ImproveTextResponse> {
  return fetchAPI<ImproveTextResponse>('/api/ai/improve-text', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

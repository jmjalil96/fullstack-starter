/**
 * improveText.service.ts
 * Service for improving text using OpenRouter AI API
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { env } from '../../../config/env.js'
import { BadRequestError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { ImproveTextResponse } from './improveText.dto.js'
import type { ImproveTextParsed } from './improveText.schema.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free'

const PROMPTS = {
  'support-reply': `Eres un asistente que mejora mensajes de soporte al cliente en español.
Mejora el siguiente mensaje: corrige errores gramaticales y ortográficos, hazlo más profesional
y cortés, pero mantén el significado original y una longitud similar.
Responde SOLO con el texto mejorado, sin explicaciones ni comentarios adicionales.

Mensaje:`,
  general: `Mejora el siguiente texto en español: corrige errores gramaticales y ortográficos,
mejora la claridad y fluidez. Mantén el significado original.
Responde SOLO con el texto mejorado, sin explicaciones.

Texto:`,
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Improve text using AI
 *
 * Authorization:
 * - Any authenticated user can use this service
 *
 * @param userId - ID of user requesting improvement
 * @param data - Text data from request (validated and parsed by Zod)
 * @returns Improved text
 * @throws {UnauthorizedError} If user not authenticated
 * @throws {BadRequestError} If OpenRouter API key not configured or API error
 */
export async function improveText(
  userId: string,
  data: ImproveTextParsed
): Promise<ImproveTextResponse> {
  // STEP 1: Check API key is configured
  const apiKey = env.OPENROUTER_API_KEY

  if (!apiKey) {
    logger.error('OpenRouter API key not configured')
    throw new BadRequestError('Servicio de IA no disponible')
  }

  // STEP 2: Build the prompt
  const systemPrompt = PROMPTS[data.context]
  const fullPrompt = `${systemPrompt}\n${data.text}`

  // STEP 3: Call OpenRouter API
  let improved: string

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.CLIENT_URL,
        'X-Title': 'Capstone AI Text Improvement',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({ status: response.status, error: errorText }, 'OpenRouter API error')
      throw new BadRequestError('Error al procesar texto con IA')
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    improved = result.choices?.[0]?.message?.content?.trim() ?? ''

    if (!improved) {
      logger.warn({ userId, textLength: data.text.length }, 'Empty response from OpenRouter')
      throw new BadRequestError('No se pudo mejorar el texto')
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err
    }

    logger.error({ error: err, userId }, 'OpenRouter API request failed')
    throw new BadRequestError('Error de conexión con servicio de IA')
  }

  // STEP 4: Log activity
  logger.info(
    {
      userId,
      context: data.context,
      inputLength: data.text.length,
      outputLength: improved.length,
    },
    'Text improved with AI'
  )

  // STEP 5: Return response
  return {
    improved,
  }
}

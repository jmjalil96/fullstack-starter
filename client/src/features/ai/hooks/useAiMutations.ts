/**
 * React Query mutation hooks for AI features
 */

import { useMutation } from '@tanstack/react-query'

import type { ImproveTextRequest } from '../ai'
import { improveText } from '../aiApi'

/**
 * Improve text using AI
 *
 * @example
 * const { mutate, mutateAsync, isPending } = useImproveText()
 *
 * // Async usage (recommended for forms)
 * const result = await mutateAsync({ text: 'hola necesito ayuda' })
 * setMessage(result.improved)
 *
 * // Callback usage
 * mutate({ text: 'hola' }, {
 *   onSuccess: (data) => setMessage(data.improved)
 * })
 */
export function useImproveText() {
  return useMutation({
    mutationFn: (data: ImproveTextRequest) => improveText(data),
  })
}

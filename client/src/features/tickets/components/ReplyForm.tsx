import { useState } from 'react'

import { Button } from '../../../shared/components/ui/forms/Button'
import { Textarea } from '../../../shared/components/ui/forms/Textarea'
import { useToast } from '../../../shared/hooks/useToast'
import { useImproveText } from '../../ai/hooks/useAiMutations'
import { useAddTicketMessage } from '../hooks/useTicketMutations'

interface ReplyFormProps {
  ticketId: string
  isDisabled?: boolean
}

/**
 * Reply form for adding messages to a ticket
 * Features keyboard shortcut (Cmd/Ctrl+Enter) and disabled state for closed tickets
 */
export function ReplyForm({ ticketId, isDisabled = false }: ReplyFormProps) {
  const [message, setMessage] = useState('')
  const addMessage = useAddTicketMessage()
  const improveText = useImproveText()
  const toast = useToast()

  const handleImprove = async () => {
    if (!message.trim() || improveText.isPending) return

    try {
      const result = await improveText.mutateAsync({
        text: message,
        context: 'support-reply',
      })
      setMessage(result.improved)
      toast.success('Texto mejorado')
    } catch {
      toast.error('No se pudo mejorar el texto')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || addMessage.isPending || isDisabled) return

    addMessage.mutate(
      { ticketId, data: { message: message.trim() } },
      {
        onSuccess: () => {
          setMessage('')
        },
      }
    )
  }

  // Cmd/Ctrl+Enter keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder={isDisabled ? 'Este caso está cerrado' : 'Escribe tu respuesta...'}
          variant="light"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || addMessage.isPending}
        />
        {/* AI Improve Button */}
        {!isDisabled && message.trim().length > 0 && (
          <button
            type="button"
            onClick={handleImprove}
            disabled={improveText.isPending}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mejorar texto con IA"
          >
            {improveText.isPending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {!isDisabled && 'Cmd+Enter para enviar'}
        </span>
        <Button
          type="submit"
          variant="primary"
          isLoading={addMessage.isPending}
          loadingText="Enviando..."
          disabled={!message.trim() || isDisabled}
        >
          Enviar Respuesta
        </Button>
      </div>
    </form>
  )
}

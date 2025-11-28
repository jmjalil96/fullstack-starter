import type { TicketMessageResponse } from '../tickets'

interface MessageBubbleProps {
  message: TicketMessageResponse
  isOwnMessage: boolean
}

/**
 * Format date to relative time string
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffHour < 24) return `hace ${diffHour}h`
  if (diffDay < 7) return `hace ${diffDay}d`

  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

/**
 * Single message in email thread style
 * Uses differentiated styling for own messages (gold) vs others (white)
 */
export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  // Generate initials for avatar
  const initials = message.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Differentiated styles based on ownership
  const bubbleClasses = isOwnMessage
    ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30'
    : 'bg-white/60 border-white/40'

  const avatarClasses = isOwnMessage
    ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
    : 'bg-[var(--color-navy)]/10 text-[var(--color-navy)]'

  return (
    <article
      className={`backdrop-blur-sm border rounded-xl p-4 transition-all hover:shadow-sm ${bubbleClasses}`}
    >
      {/* Header: Avatar + Author + Timestamp */}
      <header className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarClasses}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-navy)] truncate">
            {isOwnMessage ? 'Tú' : message.authorName}
          </p>
        </div>
        <time className="text-xs text-gray-400 flex-shrink-0">
          {formatRelativeTime(message.createdAt)}
        </time>
      </header>

      {/* Message Content */}
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-11">
        {message.message}
      </div>
    </article>
  )
}

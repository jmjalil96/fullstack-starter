/**
 * KanbanCard - Generic card wrapper for Kanban boards
 *
 * Glassmorphism-styled card with click and keyboard support.
 * Use as a wrapper and pass custom content as children.
 *
 * @example
 * <KanbanCard onClick={() => navigate('/detail/123')}>
 *   <h3>Card Title</h3>
 *   <p>Card description</p>
 * </KanbanCard>
 */

import type { CSSProperties, ReactNode, KeyboardEvent } from 'react'

interface KanbanCardProps {
  /** Card content */
  children: ReactNode
  /** Click handler (makes card interactive) */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
  /** Inline styles */
  style?: CSSProperties
}

export function KanbanCard({ children, onClick, className = '', style }: KanbanCardProps) {
  const isInteractive = !!onClick

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      style={style}
      className={`
        p-3 rounded-xl
        bg-white/70 backdrop-blur-sm border border-white/30
        shadow-sm
        ${isInteractive ? `
          cursor-pointer
          hover:bg-white/90 hover:shadow-md hover:scale-[1.01] hover:border-white/50
          active:scale-[0.99]
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1
        ` : ''}
        transition-all duration-200
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  )
}

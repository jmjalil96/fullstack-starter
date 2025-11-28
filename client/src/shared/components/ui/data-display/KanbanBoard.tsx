/**
 * KanbanBoard - Generic horizontal board container
 *
 * Horizontal scrollable container for Kanban columns with
 * snap scrolling on mobile devices.
 *
 * @example
 * <KanbanBoard>
 *   <KanbanColumn header={...}>...</KanbanColumn>
 *   <KanbanColumn header={...}>...</KanbanColumn>
 *   <KanbanColumn header={...}>...</KanbanColumn>
 * </KanbanBoard>
 */

import { Children, type ReactNode } from 'react'

interface KanbanBoardProps {
  /** KanbanColumn children */
  children: ReactNode
  /** Width of each column in pixels */
  columnWidth?: number
  /** Additional CSS classes */
  className?: string
}

export function KanbanBoard({
  children,
  columnWidth = 320,
  className = '',
}: KanbanBoardProps) {
  return (
    <div
      className={`
        flex gap-4 overflow-x-auto pb-4
        snap-x snap-mandatory
        h-[calc(100vh-260px)] min-h-[400px]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {Children.map(children, (child) => (
        <div
          className="flex-shrink-0 snap-start"
          style={{ width: columnWidth }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

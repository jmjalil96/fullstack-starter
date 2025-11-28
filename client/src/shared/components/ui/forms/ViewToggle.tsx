/**
 * ViewToggle - Toggle between list and kanban views
 *
 * Glassmorphism-styled toggle button group with icons.
 *
 * @example
 * <ViewToggle mode="kanban" onToggle={() => setMode(m => m === 'list' ? 'kanban' : 'list')} />
 */

interface ViewToggleProps {
  /** Current view mode */
  mode: 'list' | 'kanban'
  /** Callback when toggle is clicked */
  onToggle: () => void
}

/** List view icon (horizontal lines) */
function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Kanban view icon (vertical columns) */
function KanbanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2 4.5A1.5 1.5 0 013.5 3h2A1.5 1.5 0 017 4.5v11A1.5 1.5 0 015.5 17h-2A1.5 1.5 0 012 15.5v-11zm6 0A1.5 1.5 0 019.5 3h2a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-2A1.5 1.5 0 018 11.5v-7zm6 0A1.5 1.5 0 0115.5 3h2A1.5 1.5 0 0119 4.5v4a1.5 1.5 0 01-1.5 1.5h-2A1.5 1.5 0 0114 8.5v-4z" />
    </svg>
  )
}

export function ViewToggle({ mode, onToggle }: ViewToggleProps) {
  return (
    <div
      className="flex bg-white/60 backdrop-blur-xl border border-white/30 rounded-lg p-0.5 shadow-sm"
      role="group"
      aria-label="Cambiar vista"
    >
      <button
        type="button"
        onClick={mode !== 'list' ? onToggle : undefined}
        className={`p-2 rounded-md transition-all duration-200 ${
          mode === 'list'
            ? 'bg-[var(--color-navy)] text-white shadow-sm'
            : 'text-gray-400 hover:text-[var(--color-navy)] hover:bg-white/50'
        }`}
        aria-label="Vista de lista"
        aria-pressed={mode === 'list'}
      >
        <ListIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={mode !== 'kanban' ? onToggle : undefined}
        className={`p-2 rounded-md transition-all duration-200 ${
          mode === 'kanban'
            ? 'bg-[var(--color-navy)] text-white shadow-sm'
            : 'text-gray-400 hover:text-[var(--color-navy)] hover:bg-white/50'
        }`}
        aria-label="Vista Kanban"
        aria-pressed={mode === 'kanban'}
      >
        <KanbanIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

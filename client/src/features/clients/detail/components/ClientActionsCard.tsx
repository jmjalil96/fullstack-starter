/**
 * ClientActionsCard - Sidebar card with action buttons
 * Shows edit action for client management
 */

import { Button } from '../../../../shared/components/ui/Button'

/**
 * Props for ClientActionsCard component
 */
interface ClientActionsCardProps {
  /** Callback to open edit modal */
  onEdit: () => void
}

/**
 * ClientActionsCard - Action buttons for client operations
 *
 * Features:
 * - Edit button (opens edit modal)
 * - Full-width button for sidebar
 * - Consistent styling with ClaimActionsCard
 *
 * Note: Backend enforces permissions
 *
 * @example
 * <ClientActionsCard
 *   onEdit={() => setEditModalOpen(true)}
 * />
 */
export function ClientActionsCard({ onEdit }: ClientActionsCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">Acciones</h3>

      <div className="space-y-2">
        {/* Edit Button */}
        <Button variant="secondary" className="w-full justify-center" onClick={onEdit}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar Cliente
        </Button>
      </div>
    </div>
  )
}

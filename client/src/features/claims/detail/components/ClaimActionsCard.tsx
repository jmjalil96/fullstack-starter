/**
 * ClaimActionsCard - Sidebar card with action buttons
 * Shows edit and status transition actions
 */

import { Button } from '../../../../shared/components/ui/Button'
import { CLAIM_LIFECYCLE } from '../../../../shared/constants/claimLifecycle'
import type { ClaimStatus } from '../../../../shared/types/claims'

/**
 * Props for ClaimActionsCard component
 */
interface ClaimActionsCardProps {
  /** Current claim status */
  currentStatus: ClaimStatus
  /** Callback to open edit modal */
  onEdit: () => void
  /** Callback to open status transition modal */
  onStatusChange: (targetStatus: ClaimStatus) => void
}

/**
 * ClaimActionsCard - Action buttons for claim operations
 *
 * Features:
 * - Edit button (opens edit modal)
 * - Status transition buttons (from blueprint)
 * - Hides entirely for terminal states
 * - Full-width buttons for sidebar
 * - Button variants from lifecycle config
 *
 * Note: Backend enforces permissions (1.0 shows all buttons)
 *
 * @example
 * <ClaimActionsCard
 *   currentStatus="SUBMITTED"
 *   onEdit={() => setEditModalOpen(true)}
 *   onStatusChange={(status) => setSelectedTransition(status)}
 * />
 */
export function ClaimActionsCard({ currentStatus, onEdit, onStatusChange }: ClaimActionsCardProps) {
  // Get available transitions from blueprint
  const transitions = CLAIM_LIFECYCLE[currentStatus].transitions

  // Hide card entirely for terminal states (no actions available)
  if (transitions.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">Acciones</h3>

      <div className="space-y-2">
        {/* Edit Button - Always show for non-terminal states */}
        <Button variant="secondary" className="w-full justify-center" onClick={onEdit}>
          Editar Detalles
        </Button>

        {/* Divider between edit and status actions */}
        {transitions.length > 0 && <div className="border-t border-[var(--color-border)] my-3" />}

        {/* Status Transition Buttons (from blueprint) */}
        {transitions.map((transition) => (
          <Button
            key={transition.status}
            variant={transition.variant}
            className="w-full justify-center"
            onClick={() => onStatusChange(transition.status)}
          >
            <span className="mr-2" aria-hidden>
              {transition.icon}
            </span>
            {transition.buttonLabel}
          </Button>
        ))}
      </div>
    </div>
  )
}

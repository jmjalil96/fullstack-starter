/**
 * PolicyActionsCard - Sidebar card with action buttons
 * Shows edit and status transition actions
 */

import { Button } from '../../../../shared/components/ui/Button'
import { POLICY_LIFECYCLE } from '../../../../shared/constants/policyLifecycle'
import type { PolicyStatus } from '../../../../shared/types/policies'

/**
 * Props for PolicyActionsCard component
 */
interface PolicyActionsCardProps {
  /** Current policy status */
  currentStatus: PolicyStatus
  /** Callback to open edit modal */
  onEdit: () => void
  /** Callback to open status transition modal */
  onStatusTransition: (targetStatus: PolicyStatus) => void
}

/**
 * PolicyActionsCard - Action buttons for policy operations
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
 * <PolicyActionsCard
 *   currentStatus="PENDING"
 *   onEdit={() => setEditModalOpen(true)}
 *   onStatusTransition={(status) => setSelectedTransition(status)}
 * />
 */
export function PolicyActionsCard({
  currentStatus,
  onEdit,
  onStatusTransition,
}: PolicyActionsCardProps) {
  // Get available transitions from blueprint
  const transitions = POLICY_LIFECYCLE[currentStatus].transitions

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
            onClick={() => onStatusTransition(transition.status)}
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

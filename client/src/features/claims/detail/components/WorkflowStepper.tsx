/**
 * WorkflowStepper - Visual status progress indicator
 * Shows claim lifecycle flow with current position
 */

import { CLAIM_LIFECYCLE } from '../../../../shared/constants/claimLifecycle'
import type { ClaimStatus } from '../../../../shared/types/claims'

/**
 * Props for WorkflowStepper component
 */
interface WorkflowStepperProps {
  /** Current claim status */
  currentStatus: ClaimStatus
}

/**
 * Step state type
 */
type StepState = 'completed' | 'current' | 'future'

/**
 * WorkflowStepper - Visual claim lifecycle progress indicator
 *
 * Features:
 * - Shows current position in lifecycle
 * - Completed steps (green with checkmark)
 * - Current step (teal, highlighted)
 * - Future steps (gray, non-interactive)
 * - Responsive (horizontal desktop, vertical mobile)
 *
 * Flow: SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
 *
 * @example
 * <WorkflowStepper currentStatus="UNDER_REVIEW" />
 */
export function WorkflowStepper({ currentStatus }: WorkflowStepperProps) {
  // Define workflow steps
  const steps: { status: ClaimStatus; label: string }[] = [
    { status: 'SUBMITTED', label: CLAIM_LIFECYCLE.SUBMITTED.label },
    { status: 'UNDER_REVIEW', label: CLAIM_LIFECYCLE.UNDER_REVIEW.label },
    { status: 'APPROVED', label: CLAIM_LIFECYCLE.APPROVED.label },
    { status: 'REJECTED', label: CLAIM_LIFECYCLE.REJECTED.label },
  ]

  /**
   * Determine state for each step
   */
  const getStepState = (stepStatus: ClaimStatus): StepState => {
    if (stepStatus === currentStatus) return 'current'

    // Determine if completed (came before current)
    const stepOrder = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
    const currentIndex = stepOrder.indexOf(currentStatus)
    const stepIndex = stepOrder.indexOf(stepStatus)

    if (stepIndex < currentIndex) return 'completed'
    return 'future'
  }

  /**
   * Get step styling based on state (purely visual, no interactions)
   */
  const getStepClasses = (state: StepState): string => {
    const base = 'px-4 py-2 rounded-lg text-sm font-medium'

    switch (state) {
      case 'completed':
        return `${base} bg-green-50 text-green-700 border-2 border-green-500`
      case 'current':
        return `${base} bg-[var(--color-teal)] text-white border-2 border-[var(--color-teal)] shadow-md`
      case 'future':
        return `${base} bg-white text-gray-400 border-2 border-gray-300`
      default:
        return base
    }
  }

  /**
   * Get step icon based on state
   */
  const getStepIcon = (state: StepState): string => {
    switch (state) {
      case 'completed':
        return '✓'
      case 'current':
        return '●'
      case 'future':
        return '○'
      default:
        return ''
    }
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4">Estado del Reclamo</h3>

      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex items-center gap-3">
        {steps.map((step, index) => {
          const state = getStepState(step.status)

          return (
            <div key={step.status} className="flex items-center gap-3">
              {/* Step Badge (purely visual) */}
              <span className={getStepClasses(state)}>
                <span className="mr-2" aria-hidden>
                  {getStepIcon(state)}
                </span>
                {step.label}
              </span>

              {/* Connector Arrow (except after last step) */}
              {index < steps.length - 1 && (
                <span className="text-gray-400" aria-hidden>
                  →
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Vertical list */}
      <div className="sm:hidden space-y-3">
        {steps.map((step) => {
          const state = getStepState(step.status)

          return (
            <div key={step.status} className={getStepClasses(state)}>
              <span className="mr-2" aria-hidden>
                {getStepIcon(state)}
              </span>
              {step.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

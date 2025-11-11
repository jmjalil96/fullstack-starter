/**
 * WorkflowStepper - Visual status progress indicator for policies
 * Shows policy lifecycle flow with current position
 */

import { POLICY_LIFECYCLE } from '../../../../shared/constants/policyLifecycle'
import type { PolicyStatus } from '../../../../shared/types/policies'

/**
 * Props for WorkflowStepper component
 */
interface WorkflowStepperProps {
  /** Current policy status */
  currentStatus: PolicyStatus
}

/**
 * Step state type
 */
type StepState = 'completed' | 'current' | 'future'

/**
 * WorkflowStepper - Visual policy lifecycle progress indicator
 *
 * Features:
 * - Shows current position in lifecycle
 * - Completed steps (green with checkmark)
 * - Current step (teal, highlighted)
 * - Future steps (gray, non-interactive)
 * - Responsive (horizontal desktop, vertical mobile)
 * - Handles branching paths (ACTIVE → EXPIRED/CANCELLED)
 *
 * Flow: PENDING → ACTIVE → EXPIRED/CANCELLED (branching path)
 *
 * @example
 * <WorkflowStepper currentStatus="ACTIVE" />
 */
export function WorkflowStepper({ currentStatus }: WorkflowStepperProps) {
  // Define workflow steps (branching path: ACTIVE can go to EXPIRED or CANCELLED)
  const steps: { status: PolicyStatus; label: string }[] = [
    { status: 'PENDING', label: POLICY_LIFECYCLE.PENDING.label },
    { status: 'ACTIVE', label: POLICY_LIFECYCLE.ACTIVE.label },
    { status: 'EXPIRED', label: POLICY_LIFECYCLE.EXPIRED.label },
    { status: 'CANCELLED', label: POLICY_LIFECYCLE.CANCELLED.label },
  ]

  /**
   * Determine state for each step
   * Handles branching: ACTIVE can transition to either EXPIRED or CANCELLED
   */
  const getStepState = (stepStatus: PolicyStatus): StepState => {
    if (stepStatus === currentStatus) return 'current'

    // Define the lifecycle flow with branching
    // PENDING → ACTIVE → (EXPIRED or CANCELLED)
    const linearSteps = ['PENDING', 'ACTIVE']
    const terminalSteps = ['EXPIRED', 'CANCELLED']

    // If current status is a terminal state
    if (terminalSteps.includes(currentStatus)) {
      // PENDING and ACTIVE are completed
      if (linearSteps.includes(stepStatus)) return 'completed'
      // The other terminal state is future (not taken path)
      if (stepStatus !== currentStatus) return 'future'
    }

    // For linear flow (PENDING, ACTIVE)
    const currentIndex = linearSteps.indexOf(currentStatus)
    const stepIndex = linearSteps.indexOf(stepStatus)

    // If both are in linear flow
    if (currentIndex !== -1 && stepIndex !== -1) {
      if (stepIndex < currentIndex) return 'completed'
      if (stepIndex > currentIndex) return 'future'
    }

    // Default: terminal states are future when current is PENDING or ACTIVE
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
      <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4">Estado de la Póliza</h3>

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

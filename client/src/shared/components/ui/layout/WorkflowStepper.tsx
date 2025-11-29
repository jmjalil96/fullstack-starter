import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { CLAIM_LIFECYCLE } from '../../../../features/claims/claimLifecycle'
import type { ClaimStatus } from '../../../../features/claims/claims'
import { INVOICE_LIFECYCLE } from '../../../../features/invoices/invoiceLifecycle'
import type { InvoiceStatus } from '../../../../features/invoices/invoices'
import type { PolicyStatus } from '../../../../features/policies/policies'
import { POLICY_LIFECYCLE } from '../../../../features/policies/policyLifecycle'
import { Button } from '../forms/Button'

interface WorkflowStepperProps<TStatus extends string = PolicyStatus> {
  /** Current workflow status */
  currentStatus: TStatus
  /** Callback when action button is clicked */
  onActionClick: (targetStatus: TStatus) => void
  /** Additional CSS classes */
  className?: string
  /** Lifecycle type (determines which config to use) */
  lifecycle?: 'policy' | 'claim' | 'invoice'
}

/**
 * Workflow stepper with status progression and action buttons
 * Generic component that works with claims, policies, and invoices
 *
 * @example
 * // For claims
 * <WorkflowStepper
 *   lifecycle="claim"
 *   currentStatus="SUBMITTED"
 *   onActionClick={(status) => handleTransition(status)}
 * />
 *
 * @example
 * // For policies
 * <WorkflowStepper
 *   lifecycle="policy"
 *   currentStatus="ACTIVE"
 *   onActionClick={(status) => handleTransition(status)}
 * />
 */
export function WorkflowStepper<TStatus extends string = PolicyStatus>({
  currentStatus,
  onActionClick,
  className = '',
  lifecycle = 'policy',
}: WorkflowStepperProps<TStatus>) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggleDropdown = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setDropdownOpen(!dropdownOpen)
  }

  // Get configuration for the current status based on lifecycle type
  const statusConfig =
    lifecycle === 'invoice'
      ? INVOICE_LIFECYCLE[currentStatus as InvoiceStatus]
      : lifecycle === 'claim'
        ? CLAIM_LIFECYCLE[currentStatus as ClaimStatus]
        : POLICY_LIFECYCLE[currentStatus as PolicyStatus]

  // Helper to map lifecycle colors to Tailwind gradient classes
  const getStatusBadgeStyles = (color: string) => {
    const map: Record<string, string> = {
      gray: 'from-slate-400 to-slate-500 shadow-slate-400/30',
      blue: 'from-blue-400 to-blue-500 shadow-blue-400/30',
      cyan: 'from-cyan-400 to-cyan-500 shadow-cyan-400/30',
      yellow: 'from-amber-400 to-orange-400 shadow-amber-400/30',
      purple: 'from-purple-400 to-purple-500 shadow-purple-400/30',
      orange: 'from-orange-400 to-red-400 shadow-orange-400/30',
      green: 'from-emerald-400 to-teal-500 shadow-emerald-400/30',
      red: 'from-rose-500 to-pink-600 shadow-rose-500/30',
    }
    return map[color] || map.gray
  }

  // Helper to get button variant based on transition type
  const getButtonVariant = (transitionVariant: string): 'primary' | 'outline' | 'success' | 'danger' | 'action' => {
    if (transitionVariant === 'success') return 'success'
    if (transitionVariant === 'danger') return 'danger'
    if (transitionVariant === 'primary') return 'primary'
    if (transitionVariant === 'action') return 'action'
    return 'outline'
  }

  // Define the visual steps for the "mini stepper"
  const steps = useMemo(() => {
    if (lifecycle === 'invoice') {
      // Invoices: PENDING -> VALIDATED/DISCREPANCY -> CANCELLED
      const isTerminal = currentStatus === 'CANCELLED'
      const isValidated = ['VALIDATED', 'DISCREPANCY'].includes(currentStatus)
      return [
        {
          id: 'PENDING',
          label: INVOICE_LIFECYCLE.PENDING.label,
          active: currentStatus === 'PENDING',
          done: isValidated || isTerminal,
        },
        {
          id: 'VALIDATED',
          label: isValidated ? INVOICE_LIFECYCLE[currentStatus as InvoiceStatus].label : 'Validada',
          active: isValidated,
          done: isTerminal,
        },
        {
          id: 'TERMINAL',
          label: isTerminal ? 'Cancelada' : 'Cancelada',
          active: isTerminal,
          done: false,
        },
      ]
    }

    if (lifecycle === 'claim') {
      // Claims: DRAFT -> VALIDATION -> SUBMITTED -> SETTLED (with PENDING_INFO loop, RETURNED/CANCELLED alternatives)
      const isTerminal = ['RETURNED', 'SETTLED', 'CANCELLED'].includes(currentStatus)
      const isPendingInfo = currentStatus === 'PENDING_INFO'
      const isSubmitted = currentStatus === 'SUBMITTED'
      const isValidation = currentStatus === 'VALIDATION'
      const isDraft = currentStatus === 'DRAFT'

      // Step progression: DRAFT(0) -> VALIDATION(1) -> SUBMITTED(2) -> terminal(3)
      // PENDING_INFO is a special loop state from SUBMITTED
      const stepIndex = isDraft ? 0 : isValidation ? 1 : isSubmitted || isPendingInfo ? 2 : 3

      return [
        {
          id: 'DRAFT',
          label: CLAIM_LIFECYCLE.DRAFT.label,
          active: isDraft,
          done: stepIndex > 0,
        },
        {
          id: 'VALIDATION',
          label: CLAIM_LIFECYCLE.VALIDATION.label,
          active: isValidation,
          done: stepIndex > 1,
        },
        {
          id: 'SUBMITTED',
          label: isPendingInfo ? CLAIM_LIFECYCLE.PENDING_INFO.label : CLAIM_LIFECYCLE.SUBMITTED.label,
          active: isSubmitted || isPendingInfo,
          done: isTerminal,
        },
        {
          id: 'TERMINAL',
          label: isTerminal ? CLAIM_LIFECYCLE[currentStatus as ClaimStatus].label : 'Finalizado',
          active: isTerminal,
          done: false,
        },
      ]
    }

    // Policies: PENDING -> ACTIVE -> EXPIRED/CANCELLED
    const isTerminal = ['EXPIRED', 'CANCELLED'].includes(currentStatus)
    return [
      {
        id: 'PENDING',
        label: POLICY_LIFECYCLE.PENDING.label,
        active: currentStatus === 'PENDING',
        done: currentStatus !== 'PENDING',
      },
      {
        id: 'ACTIVE',
        label: POLICY_LIFECYCLE.ACTIVE.label,
        active: currentStatus === 'ACTIVE',
        done: isTerminal,
      },
      {
        id: 'TERMINAL',
        label: isTerminal ? POLICY_LIFECYCLE[currentStatus as PolicyStatus].label : 'Finalizado',
        active: isTerminal,
        done: false,
      },
    ]
  }, [currentStatus, lifecycle])

  return (
    <div
      role="group"
      aria-label={`Progreso del flujo: ${statusConfig.label}`}
      className={`
        flex flex-col md:flex-row items-center justify-between gap-4
        bg-white/70 backdrop-blur-xl border border-white/50
        rounded-2xl p-3 pl-5 shadow-sm shadow-slate-200/50
        ${className}
      `}
    >
      {/* LEFT: Status Indicator & Steps */}
      <div className="flex items-center gap-6 w-full md:w-auto">
        {/* Large Status Badge */}
        <div
          className={`
          relative flex items-center gap-2 px-4 py-1.5 rounded-full
          bg-gradient-to-r text-white font-medium text-sm shadow-lg
          ${getStatusBadgeStyles(statusConfig.color)}
        `}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          {statusConfig.label}
        </div>

        {/* Compact Dot Stepper (visible from sm breakpoint) */}
        <div className="hidden sm:flex items-center gap-1.5" role="list" aria-label="Progreso">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1.5" role="listitem">
              {idx > 0 && <div className="w-3 h-px bg-slate-300" aria-hidden="true" />}
              <div
                aria-current={step.active ? 'step' : undefined}
                aria-label={step.label}
                title={step.label}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${step.active ? 'scale-125 ring-2 ring-offset-1 ring-current' : ''}
                  ${step.done ? 'bg-slate-400' : step.active ? '' : 'bg-slate-200'}
                `}
                style={step.active ? { backgroundColor: `var(--tw-gradient-from)` } : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Transitions / Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
        {statusConfig.transitions.length > 0 ? (
          <>
            {/* Desktop: Show all buttons */}
            <div className="hidden md:flex items-center gap-2">
              {statusConfig.transitions.map((transition) => (
                <Button
                  key={transition.status}
                  variant={getButtonVariant(transition.variant)}
                  size="sm"
                  onClick={() => onActionClick(transition.status as TStatus)}
                >
                  {transition.label}
                </Button>
              ))}
            </div>

            {/* Mobile: Primary action + dropdown for secondary */}
            <div className="flex md:hidden items-center gap-2 w-full">
              {/* Primary action button */}
              {(() => {
                const primaryTransition = statusConfig.transitions[0];
                if (!primaryTransition) return null;
                return (
                  <Button
                    variant={getButtonVariant(primaryTransition.variant)}
                    size="sm"
                    onClick={() => onActionClick(primaryTransition.status as TStatus)}
                    className="flex-1"
                  >
                    {primaryTransition.label}
                  </Button>
                );
              })()}

              {/* Dropdown for secondary actions */}
              {statusConfig.transitions.length > 1 && (
                <>
                  <Button
                    ref={buttonRef}
                    variant="outline"
                    size="sm"
                    onClick={handleToggleDropdown}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="text-lg leading-none">...</span>
                  </Button>
                  {dropdownOpen &&
                    createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={() => setDropdownOpen(false)}
                          aria-hidden="true"
                        />
                        <div
                          className="fixed z-[100] bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]"
                          style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
                        >
                          {statusConfig.transitions.slice(1).map((transition) => (
                            <button
                              key={transition.status}
                              onClick={() => {
                                setDropdownOpen(false)
                                onActionClick(transition.status as TStatus)
                              }}
                              className={`
                                w-full text-left px-3 py-2 text-sm
                                hover:bg-slate-50 transition-colors
                                ${transition.variant === 'danger' ? 'text-rose-600' : ''}
                                ${transition.variant === 'success' ? 'text-emerald-600' : ''}
                                ${transition.variant === 'action' ? 'text-blue-600' : ''}
                              `}
                            >
                              {transition.label}
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                </>
              )}
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-400 italic px-2">Sin acciones disponibles</span>
        )}
      </div>
    </div>
  )
}

import { useMemo } from 'react'

import { CLAIM_LIFECYCLE } from '../../../constants/claimLifecycle'
import { INVOICE_LIFECYCLE } from '../../../constants/invoiceLifecycle'
import { POLICY_LIFECYCLE } from '../../../constants/policyLifecycle'
import type { ClaimStatus } from '../../../types/claims'
import type { InvoiceStatus } from '../../../types/invoices'
import type { PolicyStatus } from '../../../types/policies'
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
      blue: 'from-blue-400 to-blue-500 shadow-blue-400/30',
      yellow: 'from-amber-400 to-orange-400 shadow-amber-400/30',
      green: 'from-emerald-400 to-teal-500 shadow-emerald-400/30',
      orange: 'from-orange-400 to-red-400 shadow-orange-400/30',
      red: 'from-rose-500 to-pink-600 shadow-rose-500/30',
      gray: 'from-slate-400 to-slate-500 shadow-slate-400/30',
    }
    return map[color] || map.gray
  }

  // Helper to get button variant based on transition type
  const getButtonVariant = (transitionVariant: string): 'primary' | 'outline' | 'success' | 'danger' => {
    if (transitionVariant === 'success') return 'success'
    if (transitionVariant === 'danger') return 'danger'
    if (transitionVariant === 'primary') return 'primary'
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
      // Claims: SUBMITTED -> UNDER_REVIEW -> APPROVED/REJECTED
      const isTerminal = ['APPROVED', 'REJECTED'].includes(currentStatus)
      return [
        {
          id: 'SUBMITTED',
          label: CLAIM_LIFECYCLE.SUBMITTED.label,
          active: currentStatus === 'SUBMITTED',
          done: currentStatus !== 'SUBMITTED',
        },
        {
          id: 'UNDER_REVIEW',
          label: CLAIM_LIFECYCLE.UNDER_REVIEW.label,
          active: currentStatus === 'UNDER_REVIEW',
          done: isTerminal,
        },
        {
          id: 'TERMINAL',
          label: isTerminal ? CLAIM_LIFECYCLE[currentStatus as ClaimStatus].label : 'Resuelto',
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

        {/* Mini Visual Stepper (Hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400" role="list">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2" role="listitem">
              {idx > 0 && <div className="h-px w-4 bg-slate-200" aria-hidden="true" />}
              <span
                aria-current={step.active ? 'step' : undefined}
                className={`
                transition-colors duration-300
                ${step.active ? 'text-slate-800 font-bold' : ''}
                ${step.done ? 'text-slate-500' : ''}
              `}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Transitions / Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
        {statusConfig.transitions.length > 0 ? (
          statusConfig.transitions.map((transition) => (
            <Button
              key={transition.status}
              variant={getButtonVariant(transition.variant)}
              size="sm"
              onClick={() => onActionClick(transition.status as TStatus)}
            >
              <span className="mr-1.5 opacity-70">{transition.icon}</span>
              {transition.label}
            </Button>
          ))
        ) : (
          <span className="text-xs text-slate-400 italic px-2">Sin acciones disponibles</span>
        )}
      </div>
    </div>
  )
}

/**
 * PolicyHeader - Header section for policy detail page
 * Shows policy number, client info, status, and workflow stepper
 */

import { Link } from 'react-router-dom'

import type { PolicyDetailResponse } from '../../../../shared/types/policies'
import { StatusBadge } from '../../views/components'

import { WorkflowStepper } from './WorkflowStepper'

/**
 * Props for PolicyHeader component
 */
interface PolicyHeaderProps {
  /** Policy detail data */
  policy: PolicyDetailResponse
}

/**
 * PolicyHeader - Header section with navigation, title, status, and workflow
 *
 * Features:
 * - Back link to policies list
 * - Policy number as title with status badge
 * - Client name as subtitle with link to client detail
 * - WorkflowStepper integration (visual status progress)
 * - Responsive layout (stacks on mobile)
 * - Accessible (aria-label, semantic HTML)
 *
 * @example
 * <PolicyHeader policy={policy} />
 */
export function PolicyHeader({ policy }: PolicyHeaderProps) {
  return (
    <header className="mb-8">
      {/* Back Link */}
      <Link
        to="/clientes/polizas"
        aria-label="Volver a Pólizas"
        className="inline-flex items-center gap-2 text-[var(--color-teal)] hover:text-[var(--color-teal)]/80 transition-colors mb-4"
      >
        <span aria-hidden>←</span>
        Volver a Pólizas
      </Link>

      {/* Title + Status Badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
        <h1 className="text-3xl font-bold text-[var(--color-navy)] break-words">
          Póliza {policy.policyNumber}
        </h1>

        <StatusBadge status={policy.status} className="text-base px-4 py-2" />
      </div>

      {/* Client Subtitle with Link */}
      <div className="mb-6">
        <Link
          to={`/clientes/${policy.clientId}`}
          className="text-lg text-[var(--color-text-secondary)] hover:text-[var(--color-teal)] transition-colors"
        >
          Cliente: <strong className="font-semibold">{policy.clientName}</strong>
        </Link>
      </div>

      {/* Workflow Stepper: Visual status progress */}
      <WorkflowStepper currentStatus={policy.status} />
    </header>
  )
}

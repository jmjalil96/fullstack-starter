/**
 * StatusBadge - Colored badge for policy status display
 */

import { POLICY_LIFECYCLE } from '../../../../shared/constants/policyLifecycle'
import type { PolicyStatus } from '../../../../shared/types/policies'

/**
 * Props for StatusBadge component
 */
interface StatusBadgeProps {
  /** Policy status to display */
  status: PolicyStatus
  /** Additional CSS classes */
  className?: string
}

/**
 * Status configuration for colors and labels
 */
const statusConfig: Record<
  PolicyStatus,
  {
    label: string
    bgColor: string
    textColor: string
  }
> = {
  PENDING: {
    label: POLICY_LIFECYCLE.PENDING.label,
    bgColor: 'bg-[var(--color-gold-50)]',
    textColor: 'text-[var(--color-gold-700)]',
  },
  ACTIVE: {
    label: POLICY_LIFECYCLE.ACTIVE.label,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  EXPIRED: {
    label: POLICY_LIFECYCLE.EXPIRED.label,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  CANCELLED: {
    label: POLICY_LIFECYCLE.CANCELLED.label,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
}

/**
 * StatusBadge - Display policy status as colored pill badge
 *
 * Features:
 * - Colored based on status (yellow/green/orange/red)
 * - Spanish labels from POLICY_LIFECYCLE constants
 * - Accessible (role="status", aria-label)
 * - Small, inline-flex for table cells
 *
 * @example
 * <StatusBadge status="PENDING" />
 * // Renders: Yellow badge with "Pendiente"
 *
 * @example
 * // In table cell
 * <td>
 *   <StatusBadge status={policy.status} />
 * </td>
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Fallback for unknown status (defensive programming)
  const config = statusConfig[status] ?? {
    label: status,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase ${config.bgColor} ${config.textColor} ${className}`}
      role="status"
      aria-label={`Estado: ${config.label}`}
    >
      {/* Optional status indicator dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  )
}

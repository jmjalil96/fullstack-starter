/**
 * StatusBadge - Colored badge for claim status display
 */

import type { ClaimStatus } from '../../../../shared/types/claims'

/**
 * Props for StatusBadge component
 */
interface StatusBadgeProps {
  /** Claim status to display */
  status: ClaimStatus
  /** Additional CSS classes */
  className?: string
}

/**
 * Status configuration for colors and labels
 */
const statusConfig: Record<
  ClaimStatus,
  {
    label: string
    bgColor: string
    textColor: string
  }
> = {
  SUBMITTED: {
    label: 'Enviado',
    bgColor: 'bg-[var(--color-gold-50)]',
    textColor: 'text-[var(--color-gold-700)]',
  },
  UNDER_REVIEW: {
    label: 'En Revisión',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  APPROVED: {
    label: 'Aprobado',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  REJECTED: {
    label: 'Rechazado',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
}

/**
 * StatusBadge - Display claim status as colored pill badge
 *
 * Features:
 * - Colored based on status (gold/blue/green/red/teal)
 * - Spanish labels
 * - Accessible (role="status", aria-label)
 * - Small, inline-flex for table cells
 *
 * @example
 * <StatusBadge status="SUBMITTED" />
 * // Renders: Gold badge with "Enviado"
 *
 * @example
 * // In table cell
 * <td>
 *   <StatusBadge status={claim.status} />
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

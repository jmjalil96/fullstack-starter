/**
 * TypeBadge - Colored badge for affiliate type display
 */

import type { AffiliateType } from '../../../../shared/types/affiliates'

/**
 * Props for TypeBadge component
 */
interface TypeBadgeProps {
  /** Affiliate type to display */
  type: AffiliateType
  /** Additional CSS classes */
  className?: string
}

/**
 * Type configuration for colors and labels
 */
const typeConfig: Record<
  AffiliateType,
  {
    label: string
    bgColor: string
    textColor: string
  }
> = {
  OWNER: {
    label: 'Titular',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  DEPENDENT: {
    label: 'Dependiente',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
}

/**
 * TypeBadge - Display affiliate type as colored pill badge
 *
 * Features:
 * - Colored based on type (blue for OWNER, gray for DEPENDENT)
 * - Spanish labels (Titular/Dependiente)
 * - Accessible (role="status", aria-label)
 * - Small, inline-flex for table cells
 *
 * @example
 * <TypeBadge type="OWNER" />
 * // Renders: Blue badge with "Titular"
 *
 * @example
 * // In table cell
 * <td>
 *   <TypeBadge type={affiliate.type} />
 * </td>
 */
export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  // Fallback for unknown type (defensive programming)
  const config = typeConfig[type] ?? {
    label: type,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase ${config.bgColor} ${config.textColor} ${className}`}
      role="status"
      aria-label={`Tipo: ${config.label}`}
    >
      {/* Optional type indicator dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  )
}

/**
 * IsActiveBadge - Visual indicator for client active status
 */

/**
 * Props for IsActiveBadge component
 */
interface IsActiveBadgeProps {
  /** Whether the client is active */
  isActive: boolean
}

/**
 * IsActiveBadge - Display active/inactive status with color coding
 *
 * Features:
 * - Green badge for active clients
 * - Gray badge for inactive clients
 * - Semantic text
 * - Inline display
 *
 * @example
 * <IsActiveBadge isActive={true} />  // Green "Activo"
 * <IsActiveBadge isActive={false} /> // Gray "Inactivo"
 */
export function IsActiveBadge({ isActive }: IsActiveBadgeProps) {
  const styles = isActive
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200'

  const label = isActive ? 'Activo' : 'Inactivo'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}
    >
      {label}
    </span>
  )
}

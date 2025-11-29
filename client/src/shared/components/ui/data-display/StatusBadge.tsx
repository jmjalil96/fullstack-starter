/** Color variant for badges */
export type BadgeColor =
  | 'gray' | 'red' | 'orange'           // Shared
  | 'amber' | 'navy' | 'teal'           // Claims (brand colors)
  | 'blue' | 'yellow' | 'green' | 'purple'  // General purpose

/** Props for StatusBadge component */
interface StatusBadgeProps {
  /** Text to display in badge */
  label: string
  /** Color variant */
  color: BadgeColor
  /** Size variant (defaults to md) */
  size?: 'sm' | 'md'
}

/**
 * Generic status badge component
 * Displays colored pill-shaped badges for status indicators
 *
 * @example
 * <StatusBadge label="Enviado" color="blue" />
 * <StatusBadge label="Approved" color="green" size="sm" />
 */
export function StatusBadge({ label, color, size = 'md' }: StatusBadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  }

  const colorStyles: Record<BadgeColor, string> = {
    // Shared
    gray: 'bg-gray-100/80 text-gray-700 border-gray-300',
    red: 'bg-red-100/80 text-red-700 border-red-300',
    orange: 'bg-orange-100/80 text-orange-700 border-orange-300',
    // Claims (brand colors)
    amber: 'bg-amber-100/80 text-amber-700 border-amber-300',
    navy: 'bg-blue-100/80 text-blue-800 border-blue-300',
    teal: 'bg-teal-100/80 text-teal-700 border-teal-300',
    // General purpose
    blue: 'bg-blue-100/80 text-blue-700 border-blue-300',
    yellow: 'bg-yellow-100/80 text-yellow-700 border-yellow-300',
    green: 'bg-green-100/80 text-green-700 border-green-300',
    purple: 'bg-purple-100/80 text-purple-700 border-purple-300',
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium border ${sizeStyles[size]} ${colorStyles[color]}`}
    >
      {label}
    </span>
  )
}

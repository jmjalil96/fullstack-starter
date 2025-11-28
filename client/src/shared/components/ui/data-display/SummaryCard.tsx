import type { ReactNode } from 'react'

interface SummaryItem {
  /** Item label */
  label: string
  /** Item value (can be string or JSX) */
  value: ReactNode
}

interface SummaryCardProps {
  /** Card title */
  title: string
  /** Key-value pairs to display */
  items: SummaryItem[]
  /** Action button or element */
  action?: ReactNode
  /** Footer text */
  footer?: string
  /** Make card sticky to top */
  sticky?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Summary card for displaying key-value pairs with optional action
 *
 * Useful for form summaries, order totals, or any list of
 * labeled values that needs a call-to-action.
 *
 * @example
 * <SummaryCard
 *   title="Resumen"
 *   items={[
 *     { label: 'Cliente', value: 'Acme Corp' },
 *     { label: 'Total', value: '$1,234.00' },
 *   ]}
 *   action={<Button type="submit">Confirmar</Button>}
 *   footer="Los cambios se guardarán automáticamente"
 *   sticky
 * />
 */
export function SummaryCard({
  title,
  items,
  action,
  footer,
  sticky = false,
  className = '',
}: SummaryCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${sticky ? 'sticky top-6' : ''} ${className}`}
    >
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-4 text-sm text-gray-600 mb-6">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between">
            <span>{item.label}:</span>
            <span className="font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>

      {action}

      {footer && <p className="text-xs text-center text-gray-400 mt-4">{footer}</p>}
    </div>
  )
}

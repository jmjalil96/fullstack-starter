import type { ReactNode } from 'react'
import { useId } from 'react'

// --- Detail Section (The Container) ---

/** Props for DetailSection component */
interface DetailSectionProps {
  /** Section title displayed in header */
  title: string
  /** Optional action element (e.g., button) displayed in header */
  action?: ReactNode
  /** Section content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Card-like section container with glass morphism styling
 *
 * @example
 * <DetailSection title="User Info" action={<Button>Edit</Button>}>
 *   <DataGrid columns={2}>...</DataGrid>
 * </DetailSection>
 */
export function DetailSection({ title, action, children, className = '' }: DetailSectionProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={`bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm ${className}`}
    >
      <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-white/40 to-transparent">
        <h3 id={headingId} className="text-sm font-bold text-[var(--color-navy)] uppercase tracking-wide">
          {title}
        </h3>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

// --- Data Grid (The Layout) ---

/** Props for DataGrid component */
interface DataGridProps {
  /** Grid content */
  children: ReactNode
  /** Number of columns (responsive breakpoints applied automatically) */
  columns?: 1 | 2 | 3 | 4
  /** Gap between grid items (in Tailwind spacing scale) */
  gap?: 4 | 6 | 8
  /** Additional CSS classes */
  className?: string
}

/**
 * Responsive grid layout for form fields or data display
 *
 * @example
 * <DataGrid columns={3} gap={6}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </DataGrid>
 */
export function DataGrid({ children, columns = 3, gap = 6, className = '' }: DataGridProps) {
  // Map column count to Tailwind grid classes
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapClass = `gap-${gap}`

  return <div className={`grid ${gridCols[columns]} ${gapClass} ${className}`}>{children}</div>
}

// --- Data Field (The Item) ---

/** Props for DataField component */
interface DataFieldProps {
  /** Field label */
  label: string
  /** Field value (supports strings, numbers, or custom React nodes) */
  value?: string | number | ReactNode | null
  /** Optional icon displayed before label */
  icon?: ReactNode
  /** Makes field span full width of grid */
  fullWidth?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Read-only data field with label and value
 * Automatically displays "N/A" for empty values
 *
 * @example
 * <DataField
 *   label="Client Name"
 *   value={client.name}
 *   icon={<UserIcon />}
 * />
 */
export function DataField({
  label,
  value,
  icon,
  fullWidth = false,
  className = '',
}: DataFieldProps) {
  return (
    <dl className={`${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <dt className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </dt>
      <dd className="bg-white/40 backdrop-blur-sm border border-gray-200 rounded-xl p-3 text-sm font-medium text-[var(--color-navy)] transition-all break-words">
        {value || <span className="text-gray-300 italic">N/A</span>}
      </dd>
    </dl>
  )
}

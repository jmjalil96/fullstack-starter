import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Breadcrumb item */
export interface Breadcrumb {
  /** Display text for breadcrumb */
  label: string
  /** Navigation path (omit for current page) */
  to?: string
}

/** Props for PageHeader component */
interface PageHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Breadcrumb navigation items */
  breadcrumbs?: Breadcrumb[]
  /** Primary action (e.g., create button) */
  action?: ReactNode
  /** Secondary action (e.g., export button) */
  secondaryAction?: ReactNode
  /** Heading level (defaults to h1) */
  as?: 'h1' | 'h2'
}

/**
 * Page header with title, breadcrumbs, and action buttons
 *
 * @example
 * <PageHeader
 *   title="Reclamos"
 *   subtitle="Gestiona los reclamos de seguros"
 *   breadcrumbs={[
 *     { label: 'Inicio', to: '/dashboard' },
 *     { label: 'Reclamos' }
 *   ]}
 *   action={<Button>Nuevo Reclamo</Button>}
 *   secondaryAction={<Button variant="outline">Exportar</Button>}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  secondaryAction,
  as: HeadingTag = 'h1',
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Left: Title & Context */}
      <div className="space-y-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center text-xs font-medium text-gray-400">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1

                return (
                  <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-300" aria-hidden="true">/</span>}
                    {crumb.to ? (
                      <Link to={crumb.to} className="hover:text-[var(--color-navy)] transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-500" aria-current={isLast ? 'page' : undefined}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <HeadingTag className="text-2xl font-semibold text-[var(--color-navy)] tracking-tight">
          {title}
        </HeadingTag>

        {subtitle && (
          <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {secondaryAction && (
          <div className="opacity-80 hover:opacity-100 transition-opacity">{secondaryAction}</div>
        )}
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

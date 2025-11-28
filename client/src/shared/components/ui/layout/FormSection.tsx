import type { ReactNode } from 'react'

interface FormSectionProps {
  /** Section title */
  title: string
  /** Optional badge text (e.g., "Requerido", "3 Archivos") */
  badge?: string
  /** Section content */
  children: ReactNode
  /** Custom class name */
  className?: string
}

/**
 * Form section wrapper with header
 *
 * Provides consistent styling for form sections with
 * optional badge indicator.
 *
 * @example
 * <FormSection title="1. Datos Personales" badge="Requerido">
 *   <Input label="Nombre" />
 *   <Input label="Email" />
 * </FormSection>
 */
export function FormSection({ title, badge, children, className = '' }: FormSectionProps) {
  return (
    <section
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {badge && (
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

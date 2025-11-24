/**
 * Spinner - Loading indicator with glassmorphism design
 *
 * @example
 * // Basic usage
 * <Spinner />
 *
 * @example
 * // Different sizes
 * <Spinner size="sm" />
 * <Spinner size="xl" />
 *
 * @example
 * // Full page spinner
 * <Spinner fullPage />
 *
 * @example
 * // With custom label
 * <Spinner label="Cargando datos..." />
 */

interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Full page overlay spinner */
  fullPage?: boolean
  /** Additional CSS classes */
  className?: string
  /** Accessibility label for screen readers */
  label?: string
}

export function Spinner({
  size = 'md',
  fullPage = false,
  className = '',
  label = 'Cargando',
}: SpinnerProps) {
  // Size mapping
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const spinner = (
    <div role="status" className={`${fullPage ? '' : className}`}>
      <svg
        className={`animate-spin ${sizes[size]} text-blue-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/40 flex flex-col items-center gap-4">
          {spinner}
          <p className="text-sm text-gray-600 font-medium">{label}</p>
        </div>
      </div>
    )
  }

  return spinner
}
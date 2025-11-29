import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'glass' | 'outline' | 'success' | 'danger' | 'action'

  /** Size variant */
  size?: 'sm' | 'md' | 'lg'

  /** Shows loading spinner and disables button */
  isLoading?: boolean

  /** Custom loading text (defaults to "Procesando...") */
  loadingText?: string

  /** Makes button full width */
  fullWidth?: boolean

  /** Button content */
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading,
    loadingText = 'Procesando...',
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
  },
  ref
) {
  const baseStyles =
    'text-sm font-bold rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2'

  const sizeStyles = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3 px-6 text-sm',
    lg: 'py-4 px-8 text-base',
  }

  const variants = {
    primary:
      'bg-[var(--color-gold)] hover:bg-[#c5a028] text-[var(--color-navy)] shadow-lg shadow-yellow-900/20 hover:scale-[1.02]',
    glass: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white',
    outline:
      'bg-transparent border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10',
    success:
      'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100',
    danger:
      'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100',
    action:
      'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100',
  }

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
})

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

import { Spinner } from './Spinner'

/**
 * Button - Primary interactive element with loading state
 *
 * @example
 * // Basic usage
 * <Button onClick={handleClick}>Click me</Button>
 *
 * @example
 * // With loading state
 * <Button loading={isSubmitting} onClick={handleSubmit}>
 *   Submit
 * </Button>
 *
 * @example
 * // Different variants
 * <Button variant="primary">Primary</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="danger">Delete</Button>
 * <Button variant="ghost">Cancel</Button>
 *
 * @example
 * // Different sizes
 * <Button size="sm">Small</Button>
 * <Button size="lg">Large</Button>
 *
 * @example
 * // Loading with custom text
 * <Button loading={true} loadingText="Saving...">
 *   Save
 * </Button>
 */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show loading spinner and disable button */
  loading?: boolean
  /** Text to show when loading (optional) */
  loadingText?: string
  /** Button content */
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  // Variant styles
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-gold)]',
    secondary: 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] focus:ring-[var(--color-teal)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] focus:ring-[var(--color-teal)]',
  }

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  // Base styles
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  // Combined classes
  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button className={buttonClasses} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && (
        <Spinner
          size="sm"
          color={variant === 'primary' ? 'white' : variant === 'danger' ? 'white' : 'primary'}
          className="mr-2"
        />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

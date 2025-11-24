import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
  icon?: ReactNode
  variant?: 'glass' | 'light'
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, variant = 'glass', className = '', required, ...props }, ref) => {
    const generatedId = useId()
    const inputId = props.id || generatedId
    const errorId = error ? `${inputId}-error` : undefined

    // Base styles shared across all variants
    const baseStyles =
      'w-full px-4 py-3 text-sm rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed'

    // Variant-specific styles
    const variants = {
      glass: {
        label: 'block text-xs font-medium text-gray-700 ml-1',
        input:
          'bg-white/60 backdrop-blur-sm border focus:border-transparent focus:bg-white/90 focus:ring-[var(--color-gold)]/50 text-[var(--color-navy)] placeholder-gray-400',
        inputNormal: 'border-gray-200/50',
        inputError: 'border-red-400/50 focus:ring-red-400/50',
        icon: 'text-gray-400',
        errorMessage: 'text-xs text-red-600 ml-1 animate-in slide-in-from-top-1',
      },
      light: {
        label: 'block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider ml-1',
        input:
          'bg-gray-50 border focus:border-[var(--color-navy)]/30 focus:ring-[var(--color-navy)]/10 text-[var(--color-navy)] placeholder-gray-400',
        inputNormal: 'border-gray-200',
        inputError: 'border-red-400 focus:ring-red-400',
        icon: 'text-gray-400',
        errorMessage: 'text-xs text-red-500 ml-1',
      },
    }

    const currentVariant = variants[variant]

    // Input element
    const inputElement = (
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={`${baseStyles} ${currentVariant.input} ${
          error ? currentVariant.inputError : currentVariant.inputNormal
        } ${className}`}
        {...props}
      />
    )

    // Icon element
    const iconElement = icon && (
      <div className={`absolute right-3 top-3.5 ${currentVariant.icon}`}>
        {icon}
      </div>
    )

    // If label or error exists, use wrapper with spacing
    if (label || error) {
      return (
        <div className="space-y-1.5 w-full">
          {label && (
            <label htmlFor={inputId} className={currentVariant.label}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="relative">
            {inputElement}
            {iconElement}
          </div>
          {error && <p id={errorId} className={currentVariant.errorMessage}>{error.message}</p>}
        </div>
      )
    }

    // Without label/error, use simple wrapper for inline usage
    return (
      <div className="relative w-full">
        {inputElement}
        {iconElement}
      </div>
    )
  }
)

Input.displayName = 'Input'

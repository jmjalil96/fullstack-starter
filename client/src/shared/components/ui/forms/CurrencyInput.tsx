import { forwardRef, useState, useEffect } from 'react'
import type { FieldError } from 'react-hook-form'

import { Input } from './Input'

interface CurrencyInputProps {
  /** Input value (raw number string like "150.50") */
  value?: string
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  /** Input label */
  label?: string
  /** Validation error */
  error?: FieldError
  /** Variant style */
  variant?: 'glass' | 'light'
  /** Disabled state */
  disabled?: boolean
  /** Input ID */
  id?: string
  /** Input name */
  name?: string
}

/**
 * Currency input with automatic formatting
 *
 * Features:
 * - Shows raw value while focused (easier to edit: "150.5")
 * - Shows formatted currency on blur ($150.50)
 * - Handles European format (123,45 → 123.45)
 * - Handles paste ($1,234.56 → 1234.56)
 * - Mobile numeric keyboard (inputMode="decimal")
 * - Hardcoded: es-EC locale, USD currency
 *
 * @example
 * <Controller
 *   name="amount"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <CurrencyInput
 *       label="Monto ($)"
 *       error={fieldState.error}
 *       {...field}
 *     />
 *   )}
 * />
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const [displayValue, setDisplayValue] = useState('')

    // Format number to currency string
    const formatCurrency = (val: string): string => {
      if (!val || val.trim() === '') return ''

      // Remove all non-numeric characters except decimal point and minus
      const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
      const number = parseFloat(cleaned)

      if (isNaN(number)) return val // Return as-is if invalid

      return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number)
    }

    // Update display value when controlled value changes or focus changes
    useEffect(() => {
      if (isFocused) {
        // While focused, show raw value for easy editing
        setDisplayValue(value || '')
      } else {
        // While unfocused, show formatted currency
        setDisplayValue(value ? formatCurrency(value) : '')
      }
    }, [value, isFocused])

    const handleFocus = () => {
      setIsFocused(true)
      // Show raw value for editing
      setDisplayValue(value || '')
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      // Format the value for display
      if (value) {
        setDisplayValue(formatCurrency(value))
      }
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Remove currency symbols and format for storage
      const cleaned = inputValue.replace(/[^0-9.-]/g, '').replace(',', '.')

      // Update display immediately while typing
      setDisplayValue(inputValue)

      // Call parent onChange with cleaned value
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: cleaned },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        aria-label="Currency amount in USD"
        {...props}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

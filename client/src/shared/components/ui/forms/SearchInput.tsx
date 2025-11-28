import { useState, useId, type KeyboardEvent } from 'react'

interface SearchInputProps {
  /** Current search value */
  value: string
  /** Called when input value changes */
  onChange: (value: string) => void
  /** Called on Enter key or search button click */
  onSubmit?: () => void
  /** Placeholder text */
  placeholder?: string
  /** Shows spinner in search button */
  isLoading?: boolean
  /** Visual variant */
  variant?: 'glass' | 'light'
  /** Disabled state */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Search input with explicit submit trigger (Enter key or button click)
 * Does NOT debounce - user controls when to search
 *
 * @example
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   onSubmit={handleSearch}
 *   placeholder="Buscar..."
 *   isLoading={isSearching}
 * />
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar...',
  isLoading = false,
  variant = 'light',
  disabled = false,
  className = '',
}: SearchInputProps) {
  const inputId = useId()
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
    if (e.key === 'Escape') {
      onChange('')
    }
  }

  const handleClear = () => {
    onChange('')
    onSubmit?.()
  }

  const handleSubmit = () => {
    onSubmit?.()
  }

  // Variant styles matching Input component patterns
  const variants = {
    glass: {
      container: 'bg-white/60 backdrop-blur-sm border-gray-200/50',
      containerFocused: 'border-transparent bg-white/90 ring-2 ring-[var(--color-gold)]/50',
      input: 'text-[var(--color-navy)] placeholder-gray-400',
      icon: 'text-gray-400',
      iconHover: 'hover:text-gray-600',
    },
    light: {
      container: 'bg-gray-50 border-gray-200',
      containerFocused: 'border-[var(--color-navy)]/30 ring-2 ring-[var(--color-navy)]/10',
      input: 'text-[var(--color-navy)] placeholder-gray-400',
      icon: 'text-gray-400',
      iconHover: 'hover:text-[var(--color-navy)]',
    },
  }

  const currentVariant = variants[variant]
  const hasValue = value.length > 0

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all
        ${currentVariant.container}
        ${isFocused ? currentVariant.containerFocused : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Search Icon */}
      <svg
        className={`w-4 h-4 flex-shrink-0 ${currentVariant.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {/* Input */}
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        className={`
          flex-1 bg-transparent text-sm outline-none
          ${currentVariant.input}
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      />

      {/* Clear Button - shown when has value */}
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={`p-1 rounded-full transition-colors ${currentVariant.icon} ${currentVariant.iconHover}`}
          aria-label="Limpiar búsqueda"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || isLoading}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          bg-[var(--color-gold)] text-white
          hover:bg-[var(--color-gold)]/90
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Buscar"
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
        ) : (
          'Buscar'
        )}
      </button>
    </div>
  )
}

/**
 * SearchableSelect - Generic searchable select component using Headless UI Combobox
 */

import { Combobox } from '@headlessui/react'
import { forwardRef, useEffect, useId, useState } from 'react'

import { Spinner } from '../ui/Spinner'

/**
 * Option shape for SearchableSelect
 */
export interface SelectOption {
  value: string
  label: string
}

/**
 * Props for SearchableSelect component
 */
export interface SearchableSelectProps {
  /** Field label */
  label: string
  /** Array of options to display */
  options: SelectOption[]
  /** Currently selected value */
  value: string
  /** Change handler */
  onChange: (value: string) => void
  /** Loading state (shows spinner in dropdown) */
  loading?: boolean
  /** Error message (displays in red below field) */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Placeholder text when nothing selected */
  placeholder?: string
}

/**
 * SearchableSelect - Accessible searchable select with debounced filtering
 *
 * Features:
 * - Search/filter with 200ms debounce
 * - Loading spinner in dropdown
 * - Error display below field
 * - Full keyboard navigation
 * - Screen reader support
 * - Empty states handling
 *
 * @example
 * <SearchableSelect
 *   label="Cliente"
 *   options={[{ value: '1', label: 'TechCorp' }]}
 *   value={selectedClient}
 *   onChange={setSelectedClient}
 *   loading={loading}
 *   error={error}
 * />
 */
export const SearchableSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(
  function SearchableSelect(
    {
      label,
      options,
      value,
      onChange,
      loading = false,
      error,
      disabled = false,
      placeholder = 'Buscar...',
    },
    ref
  ) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const errorId = useId()

  // Debounce query for filtering (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Filter options based on debounced query
  const filteredOptions =
    debouncedQuery === ''
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(debouncedQuery.toLowerCase())
        )

  // Find selected option for display
  const selectedOption = options.find((option) => option.value === value)

  // Handle selection - clear query after choosing
  const handleChange = (val: string | null) => {
    onChange(val || '')
    setQuery('') // Reset search query after selection
  }

  return (
    <div>
      <Combobox value={value} onChange={handleChange} disabled={disabled}>
        {/* Label */}
        <Combobox.Label className="block text-sm font-medium text-[var(--color-navy)] mb-2">
          {label}
        </Combobox.Label>

        {/* Input Container */}
        <div className="relative">
          {/* Search Input */}
          <Combobox.Input
            ref={ref}
            className="w-full px-4 py-2.5 pr-10 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
            displayValue={() => selectedOption?.label || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            aria-busy={loading}
          />

          {/* Dropdown Button (Chevron Icon) */}
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-[var(--color-text-light)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Combobox.Button>

          {/* Dropdown Options */}
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white shadow-lg border border-[var(--color-border)] py-1">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Cargando...</span>
              </div>
            )}

            {/* Empty State - No Options Provided */}
            {!loading && options.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                No hay opciones disponibles
              </div>
            )}

            {/* Empty State - No Search Results */}
            {!loading && options.length > 0 && filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                No se encontraron resultados para &quot;{debouncedQuery}&quot;
              </div>
            )}

            {/* Options List */}
            {!loading &&
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2.5 px-4 ${
                      active ? 'bg-[var(--color-bg-hover)] text-[var(--color-navy)]' : 'text-[var(--color-text-primary)]'
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span className={selected ? 'font-semibold' : 'font-normal'}>
                        {option.label}
                      </span>
                      {/* Checkmark for selected option */}
                      {selected && (
                        <svg
                          className="h-5 w-5 text-[var(--color-teal)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                </Combobox.Option>
              ))}
          </Combobox.Options>
        </div>
      </Combobox>

      {/* Error Message */}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
  }
)

import { useState, useEffect, useRef, type ReactNode } from 'react'

import { Button } from '../forms/Button'
import { Input } from '../forms/Input'
import { SearchableSelect, type SelectOption } from '../forms/SearchableSelect'

/** Configuration for a single filter */
export interface FilterConfig {
  /** Unique key for this filter (used in values object) */
  key: string
  /** Type of filter input */
  type: 'text' | 'select' | 'searchable-select'
  /** Label text (optional, for accessibility) */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Options for select types */
  options?: SelectOption[]
  /** Optional icon (for text inputs) */
  icon?: ReactNode
}

/** Props for FilterBar component */
interface FilterBarProps {
  /** Array of filter configurations */
  config: FilterConfig[]
  /** Current filter values */
  values: Record<string, string>
  /** Callback when any filter changes */
  onChange: (values: Record<string, string>) => void
  /** Optional callback to clear all filters */
  onClear?: () => void
}

/**
 * Filter bar with search and dropdown filters
 * Text inputs are debounced (300ms) to prevent API spam
 * Responsive layout with mobile collapse
 *
 * @example
 * const config: FilterConfig[] = [
 *   { key: 'search', type: 'text', placeholder: 'Search...', icon: <SearchIcon /> },
 *   { key: 'status', type: 'searchable-select', label: 'Status', options: [...] }
 * ]
 *
 * <FilterBar
 *   config={config}
 *   values={{ search: '', status: '' }}
 *   onChange={handleFilterChange}
 *   onClear={handleClear}
 * />
 */
export function FilterBar({ config, values, onChange, onClear }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localTextValues, setLocalTextValues] = useState<Record<string, string>>({})

  // Track previous values to detect external changes
  const prevValuesRef = useRef(values)

  // Sync external value changes back to local state (only when values prop changes externally)
  useEffect(() => {
    const textFilters = config.filter((f) => f.type === 'text')

    // Find fields that were externally cleared
    const fieldsToReset = textFilters.filter((filter) => {
      const prevValue = prevValuesRef.current[filter.key] ?? ''
      const newValue = values[filter.key] ?? ''
      const localValue = localTextValues[filter.key] ?? ''

      // External value changed to empty but local still has value
      return prevValue !== newValue && newValue === '' && localValue !== ''
    })

    // Clear local values for fields that were externally reset
    if (fieldsToReset.length > 0) {
      setLocalTextValues((prev) => {
        const updated = { ...prev }
        fieldsToReset.forEach((filter) => delete updated[filter.key])
        return updated
      })
    }

    prevValuesRef.current = values
  }, [values, config, localTextValues])

  // Debounce text input values (300ms delay) - prevents API spam
  useEffect(() => {
    const textFilters = config.filter((f) => f.type === 'text')
    const hasTextFilters = textFilters.length > 0

    if (!hasTextFilters) return

    const timer = setTimeout(() => {
      const hasChanges = textFilters.some((filter) => {
        const localValue = localTextValues[filter.key] ?? values[filter.key] ?? ''
        const currentValue = values[filter.key] || ''
        return localValue !== currentValue
      })

      if (hasChanges) {
        onChange({ ...values, ...localTextValues })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localTextValues]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextChange = (key: string, value: string) => {
    setLocalTextValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="bg-white/50 backdrop-blur-md border border-gray-200/30 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Primary Search Inputs (Text) */}
        {config
          .filter((f) => f.type === 'text')
          .map((filter) => {
            const inputId = `filter-${filter.key}`
            const localValue = localTextValues[filter.key] ?? values[filter.key] ?? ''

            return (
              <div key={filter.key} className="flex-1 min-w-[200px]">
                {filter.label && (
                  <label htmlFor={inputId} className="block text-xs font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                )}
                <Input
                  id={inputId}
                  variant="light"
                  placeholder={filter.placeholder}
                  value={localValue}
                  onChange={(e) => handleTextChange(filter.key, e.target.value)}
                  icon={filter.icon}
                />
              </div>
            )
          })}

        {/* Toggle Button for Mobile */}
        <div className="lg:hidden">
          <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)} fullWidth>
            {isExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>

        {/* Secondary Filters (Selects) - Both types render as SearchableSelect for consistency */}
        <div
          className={`flex flex-col lg:flex-row gap-4 flex-wrap ${
            isExpanded ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {config
            .filter((f) => f.type === 'select' || f.type === 'searchable-select')
            .map((filter) => {
              const selectId = `filter-${filter.key}`

              return (
                <div key={filter.key} className="w-full lg:w-48">
                  {filter.label && (
                    <label htmlFor={selectId} className="block text-xs font-medium text-gray-700 mb-1">
                      {filter.label}
                    </label>
                  )}
                  <SearchableSelect
                    options={filter.options || []}
                    value={values[filter.key]}
                    onChange={(val) => handleSelectChange(filter.key, val)}
                    placeholder={filter.placeholder}
                  />
                </div>
              )
            })}

          {/* Clear Button */}
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

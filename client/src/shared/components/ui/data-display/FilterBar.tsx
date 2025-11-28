import { useState, useEffect, useRef } from 'react'

import { Button } from '../forms/Button'
import { DateRangeFilter, type DateFieldOption } from '../forms/DateRangeFilter'
import { Input } from '../forms/Input'
import { SearchableSelect, type SelectOption } from '../forms/SearchableSelect'

/** Configuration for a single filter */
export interface FilterConfig {
  /** Unique key for this filter (used in values object) */
  key: string
  /** Type of filter input */
  type: 'text' | 'select' | 'searchable-select' | 'date-range'
  /** Label text (optional, for accessibility) */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Options for select types */
  options?: SelectOption[]
  /** Options for date-range type (date field options) */
  dateFieldOptions?: DateFieldOption[]
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
 * Text inputs require explicit submit (Enter key or search button)
 * Responsive layout with mobile collapse
 *
 * For date-range filters, values are stored with compound keys:
 * - `{key}Field` - selected date field
 * - `{key}From` - start date (ISO)
 * - `{key}To` - end date (ISO)
 *
 * @example
 * const config: FilterConfig[] = [
 *   { key: 'search', type: 'text', placeholder: 'Search...' },
 *   { key: 'status', type: 'searchable-select', label: 'Status', options: [...] },
 *   { key: 'date', type: 'date-range', dateFieldOptions: [...] }
 * ]
 *
 * <FilterBar
 *   config={config}
 *   values={{ search: '', status: '', dateField: '', dateFrom: '', dateTo: '' }}
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

  const handleTextChange = (key: string, value: string) => {
    setLocalTextValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleTextSubmit = () => {
    const textFilters = config.filter((f) => f.type === 'text')
    const hasChanges = textFilters.some((filter) => {
      const localValue = localTextValues[filter.key] ?? values[filter.key] ?? ''
      const currentValue = values[filter.key] || ''
      return localValue !== currentValue
    })

    if (hasChanges) {
      onChange({ ...values, ...localTextValues })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const handleSelectChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const handleDateRangeChange = (
    key: string,
    dateValue: { field: string; from: string; to: string }
  ) => {
    onChange({
      ...values,
      [`${key}Field`]: dateValue.field,
      [`${key}From`]: dateValue.from,
      [`${key}To`]: dateValue.to,
    })
  }

  const textFilters = config.filter((f) => f.type === 'text')
  const selectFilters = config.filter((f) => f.type === 'select' || f.type === 'searchable-select')
  const dateRangeFilters = config.filter((f) => f.type === 'date-range')

  return (
    <div className="bg-white/50 backdrop-blur-md border border-gray-200/30 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Primary Search Inputs (Text) */}
        {textFilters.map((filter) => {
          const inputId = `filter-${filter.key}`
          const localValue = localTextValues[filter.key] ?? values[filter.key] ?? ''

          return (
            <div key={filter.key} className="flex-1 min-w-[200px]">
              {filter.label && (
                <label htmlFor={inputId} className="block text-xs font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
              )}
              <div className="flex gap-2">
                <Input
                  id={inputId}
                  variant="light"
                  placeholder={filter.placeholder}
                  value={localValue}
                  onChange={(e) => handleTextChange(filter.key, e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={handleTextSubmit}
                  className="px-3 bg-[var(--color-navy)] text-white rounded-xl hover:bg-[var(--color-navy)]/90 transition-colors"
                  aria-label="Buscar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}

        {/* Toggle Button for Mobile */}
        {(selectFilters.length > 0 || dateRangeFilters.length > 0) && (
          <div className="lg:hidden">
            <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)} fullWidth>
              {isExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>
        )}

        {/* Secondary Filters (Selects + Date Range) */}
        <div
          className={`flex flex-col lg:flex-row gap-4 flex-wrap ${
            isExpanded ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Select Filters */}
          {selectFilters.map((filter) => {
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

          {/* Date Range Filters */}
          {dateRangeFilters.map((filter) => (
            <div key={filter.key} className="w-full lg:w-48">
              {filter.label && (
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
              )}
              <DateRangeFilter
                fieldOptions={filter.dateFieldOptions || []}
                selectedField={values[`${filter.key}Field`] || ''}
                dateFrom={values[`${filter.key}From`] || ''}
                dateTo={values[`${filter.key}To`] || ''}
                onChange={(val) => handleDateRangeChange(filter.key, val)}
                placeholder={filter.placeholder}
              />
            </div>
          ))}

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

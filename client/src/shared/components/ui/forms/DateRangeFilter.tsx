import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

import { DateInput } from './DateInput'

export interface DateFieldOption {
  value: string
  label: string
}

interface DateRangeFilterProps {
  fieldOptions: DateFieldOption[]
  selectedField?: string
  dateFrom?: string
  dateTo?: string
  onChange: (value: { field: string; from: string; to: string }) => void
  placeholder?: string
}

/**
 * Date range filter dropdown
 * Shows a trigger button that opens a dropdown with:
 * - Date field selector
 * - From/To date inputs
 * Values are only applied when clicking "Aplicar"
 */
export function DateRangeFilter({
  fieldOptions,
  selectedField = '',
  dateFrom = '',
  dateTo = '',
  onChange,
  placeholder = 'Fecha',
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  // Local state for pending changes (not yet applied)
  const [localField, setLocalField] = useState(selectedField)
  const [localFrom, setLocalFrom] = useState(dateFrom)
  const [localTo, setLocalTo] = useState(dateTo)

  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Sync local state when props change (e.g., external clear)
  useEffect(() => {
    setLocalField(selectedField)
    setLocalFrom(dateFrom)
    setLocalTo(dateTo)
  }, [selectedField, dateFrom, dateTo])

  // "Active" is based on applied values (props), not local state
  const isActive = selectedField && (dateFrom || dateTo)
  const selectedFieldLabel = fieldOptions.find((f) => f.value === selectedField)?.label

  // Format date for display (DD/MM)
  const formatShortDate = (isoDate: string) => {
    if (!isoDate) return '...'
    const [datePart] = isoDate.split('T')
    const parts = datePart.split('-')
    if (parts.length !== 3) return '...'
    const [, month, day] = parts
    return `${day}/${month}`
  }

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const dropdownHeight = 320

    const shouldFlipToTop = spaceBelow < dropdownHeight && rect.top > spaceBelow

    setDropdownPos({
      top: shouldFlipToTop ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: 340,
    })
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  // Close on outside click (but not when clicking on date picker calendars)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Check if click is inside a date picker calendar (rendered via portal)
      const isInsideCalendar = target.closest('[data-date-picker-calendar]')
      if (isInsideCalendar) return

      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Handlers update local state only
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalField(e.target.value)
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFrom(e.target.value)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTo(e.target.value)
  }

  // Apply changes and close
  const handleApply = () => {
    onChange({ field: localField, from: localFrom, to: localTo })
    setIsOpen(false)
  }

  // Clear and apply immediately
  const handleClear = () => {
    setLocalField('')
    setLocalFrom('')
    setLocalTo('')
    onChange({ field: '', from: '', to: '' })
    setIsOpen(false)
  }

  // Build display label (from applied values)
  const displayLabel = isActive
    ? `${selectedFieldLabel}: ${formatShortDate(dateFrom)} - ${formatShortDate(dateTo)}`
    : placeholder

  // Check if local state has pending changes
  const hasLocalChanges = localField && (localFrom || localTo)

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full text-left px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 flex items-center justify-between min-w-[180px] transition-colors ${
          isActive
            ? 'bg-[var(--color-navy)] text-white border-[var(--color-navy)]'
            : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <svg
            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className={`truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
            {displayLabel}
          </span>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isActive ? 'text-white' : 'text-gray-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 9999,
            }}
            className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-xl p-5 animate-in fade-in slide-in-from-top-1"
          >
            <div className="space-y-5">
              {/* Date Field Selector */}
              <div>
                <label
                  htmlFor="date-field-select"
                  className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                >
                  Campo de Fecha
                </label>
                <select
                  id="date-field-select"
                  value={localField}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)]/10 focus:border-[var(--color-navy)]/30 transition-all"
                >
                  <option value="">Seleccionar campo...</option>
                  {fieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Inputs - only show when field is selected */}
              {localField && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date-from-input"
                      className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                    >
                      Desde
                    </label>
                    <DateInput
                      id="date-from-input"
                      value={localFrom}
                      onChange={handleFromChange}
                      variant="light"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="date-to-input"
                      className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                    >
                      Hasta
                    </label>
                    <DateInput
                      id="date-to-input"
                      value={localTo}
                      onChange={handleToChange}
                      variant="light"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                {(isActive || hasLocalChanges) ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Limpiar
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 text-sm font-medium bg-[var(--color-navy)] text-white rounded-xl hover:bg-[var(--color-navy)]/90 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

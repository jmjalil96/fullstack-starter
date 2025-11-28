import { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import type { FieldError } from 'react-hook-form'

import type { SelectOption } from './SearchableSelect'

interface MultiSelectSearchableProps {
  options: SelectOption[]
  value?: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
  label?: string
  error?: FieldError
  required?: boolean
  emptyText?: string
  maxSelections?: number
  variant?: 'glass' | 'light'
}

export function MultiSelectSearchable({
  options,
  value = [],
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  isLoading = false,
  label,
  error,
  required,
  emptyText = 'No se encontraron resultados',
  maxSelections,
  variant = 'glass',
}: MultiSelectSearchableProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, flipToTop: false })

  const dropdownId = useId()
  const generatedErrorId = useId()
  const errorId = error ? generatedErrorId : undefined
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  )

  // Memoized filtered options for performance
  const filteredOptions = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  )

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [search])

  // Calculate dropdown position and detect if it should flip to top
  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const dropdownHeight = 320 // Approximate max height (larger due to checkboxes)

    // Flip to top if not enough space below and more space above
    const shouldFlipToTop = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    setDropdownPos({
      top: shouldFlipToTop
        ? rect.top + window.scrollY - dropdownHeight - 4
        : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      flipToTop: shouldFlipToTop,
    })
  }, [isOpen])

  // Calculate position when opening
  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Close dropdown and clear search (reusable)
  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearch('')
    setHighlightedIndex(-1)
  }, [])

  // Outside click handling
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [closeDropdown])

  // Toggle option selection
  const toggleOption = useCallback(
    (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : maxSelections && value.length >= maxSelections
          ? value
          : [...value, optionValue]
      onChange(newValue)
    },
    [value, onChange, maxSelections]
  )

  // Remove chip
  const removeChip = useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(value.filter((v) => v !== optionValue))
    },
    [value, onChange]
  )

  // Select all
  const selectAll = useCallback(() => {
    const allValues = maxSelections
      ? filteredOptions.slice(0, maxSelections).map((o) => o.value)
      : filteredOptions.map((o) => o.value)
    onChange(allValues)
  }, [filteredOptions, onChange, maxSelections])

  // Clear all
  const clearAll = useCallback(() => {
    onChange([])
  }, [onChange])

  // Keyboard navigation for trigger button
  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          setIsOpen(!isOpen)
          break
        case 'ArrowDown':
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          break
        case 'Escape':
          if (isOpen) {
            e.preventDefault()
            closeDropdown()
          }
          break
      }
    },
    [disabled, isLoading, isOpen, closeDropdown]
  )

  // Keyboard navigation for dropdown
  const handleDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            toggleOption(filteredOptions[highlightedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          closeDropdown()
          triggerRef.current?.focus()
          break
        case 'Tab':
          closeDropdown()
          break
      }
    },
    [filteredOptions, highlightedIndex, toggleOption, closeDropdown]
  )

  // Variant styles
  const variants = {
    glass: {
      trigger: 'bg-white/60 backdrop-blur-sm border focus:border-transparent focus:bg-white/90 focus:ring-[var(--color-gold)]/50',
      triggerError: 'border-red-400/50 focus:ring-red-400/50',
      dropdown: 'bg-white/90 backdrop-blur-xl border border-white/20',
      label: 'block text-xs font-medium text-gray-700 ml-1',
    },
    light: {
      trigger: 'bg-gray-50 border-gray-200 text-[var(--color-navy)] hover:bg-gray-100 focus:ring-[var(--color-navy)]/10',
      triggerError: 'border-red-400 focus:ring-red-400',
      dropdown: 'bg-white border border-gray-200 shadow-lg',
      label: 'block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider ml-1',
    },
  }

  const currentVariant = variants[variant]

  const selectElement = (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled || isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        role="combobox"
        className={`w-full text-left px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 flex items-center justify-between min-w-[180px] transition-colors ${
          disabled || isLoading
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
            : error
              ? currentVariant.triggerError
              : currentVariant.trigger
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[20px]">
          {isLoading ? (
            <span className="text-gray-400">Cargando...</span>
          ) : selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-navy)] text-white rounded-md text-xs"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => removeChip(option.value, e)}
                  className="hover:opacity-80"
                  aria-label={`Eliminar ${option.label}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        {isLoading ? (
          <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && !disabled && !isLoading &&
        createPortal(
          <div
            ref={dropdownRef}
            id={dropdownId}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleDropdownKeyDown}
            style={{
              position: 'absolute',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 9999,
            }}
            className={`${currentVariant.dropdown} rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1`}
          >
            <div className="p-2 space-y-2">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar opciones"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--color-gold)]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex-1 px-2 py-1 text-xs bg-[var(--color-navy)] text-white rounded-md hover:opacity-90 transition-opacity"
                  disabled={maxSelections ? value.length >= maxSelections : false}
                >
                  Seleccionar todos
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = value.includes(option.value)
                  const isDisabled = !isSelected && !!maxSelections && value.length >= maxSelections
                  return (
                    <label
                      key={option.value}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : index === highlightedIndex
                            ? 'bg-[var(--color-navy)] text-white'
                            : isSelected
                              ? 'bg-[var(--color-gold)]/10 text-[var(--color-navy)] font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && toggleOption(option.value)}
                        disabled={isDisabled}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--color-navy)] focus:ring-[var(--color-gold)]"
                        aria-label={option.label}
                      />
                      <span className="flex-1">{option.label}</span>
                    </label>
                  )
                })
              ) : (
                <div className="px-4 py-2 text-xs text-gray-400 text-center">
                  {emptyText}
                </div>
              )}
            </div>
            {maxSelections && (
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                {value.length} / {maxSelections} seleccionados
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )

  // If label or error exists, wrap with spacing
  if (label || error) {
    return (
      <div className={`space-y-1.5 w-full ${className}`}>
        {label && (
          <label className={currentVariant.label}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {selectElement}
        {error && <p id={errorId} className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1">{error.message}</p>}
      </div>
    )
  }

  return selectElement
}

MultiSelectSearchable.displayName = 'MultiSelectSearchable'
import { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import type { FieldError } from 'react-hook-form'

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
  label?: string
  error?: FieldError
  required?: boolean
  emptyText?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  isLoading = false,
  label,
  error,
  required,
  emptyText = 'No se encontraron resultados',
}: SearchableSelectProps) {
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

  const selectedOption = options.find((o) => o.value === value)

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
    const dropdownHeight = 250 // Approximate max height

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

  // Select option handler
  const selectOption = useCallback(
    (optionValue: string) => {
      onChange(optionValue)
      closeDropdown()
    },
    [onChange, closeDropdown]
  )

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
          e.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            selectOption(filteredOptions[highlightedIndex].value)
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
    [filteredOptions, highlightedIndex, selectOption, closeDropdown]
  )

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
        className={`w-full text-left px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 flex items-center justify-between min-w-[180px] transition-colors ${
          disabled || isLoading
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
            : 'bg-gray-50 border-gray-200 text-[var(--color-navy)] hover:bg-gray-100'
        }`}
      >
        <span className={selectedOption && !disabled ? 'text-[var(--color-navy)]' : 'text-gray-400'}>
          {isLoading ? 'Cargando...' : selectedOption ? selectedOption.label : placeholder}
        </span>
        {isLoading ? (
          <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1"
          >
            <div className="p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar opciones"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => selectOption(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      index === highlightedIndex
                        ? 'bg-[var(--color-navy)] text-white'
                        : value === option.value
                          ? 'bg-[var(--color-gold)]/10 text-[var(--color-navy)] font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-xs text-gray-400 text-center">
                  {emptyText}
                </div>
              )}
            </div>
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
          <label className="block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {selectElement}
        {error && <p id={errorId} className="text-xs text-red-500 mt-1">{error.message}</p>}
      </div>
    )
  }

  return selectElement
}

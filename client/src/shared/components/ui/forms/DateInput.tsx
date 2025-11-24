import { es } from 'date-fns/locale'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { createPortal } from 'react-dom'
import type { FieldError } from 'react-hook-form'

import { Input } from './Input'
import 'react-day-picker/style.css'

interface DateInputProps {
  /** Input value (ISO date string like "2025-11-22" or "2025-11-22T00:00:00.000Z") */
  value?: string
  /** Change handler (compatible with react-hook-form Controller) */
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
  /** Input name (used by RHF) */
  name?: string
}

/**
 * Date input with calendar picker
 *
 * Pragmatic behavior:
 * - Form **always** gets ISO (YYYY-MM-DD) or ''.
 * - User types DD/MM/YYYY.
 * - While focused, we don't fight the user's typing.
 * - When not focused, we sync display from `value`.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [displayValue, setDisplayValue] = useState('')
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

    const containerRef = useRef<HTMLDivElement>(null)
    const calendarRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Format ISO date to DD/MM/YYYY for display
    const formatDateDisplay = (isoDate: string | undefined | null): string => {
      if (!isoDate) return ''

      // Take only the date part if there's time info
      const [datePart] = isoDate.split('T')
      const parts = datePart.split('-')
      if (parts.length !== 3) return ''

      const [year, month, day] = parts
      if (!year || !month || !day) return ''

      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
    }

    // Parse DD/MM/YYYY or ISO → ISO (YYYY-MM-DD). Returns '' for invalid/incomplete.
    const parseToISO = (input: string): string => {
      const trimmed = input.trim()
      if (!trimmed) return ''

      // DD/MM/YYYY
      const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (ddmmyyyyMatch) {
        const [, dayStr, monthStr, yearStr] = ddmmyyyyMatch
        const d = parseInt(dayStr, 10)
        const m = parseInt(monthStr, 10)

        if (m < 1 || m > 12) return ''
        if (d < 1 || d > 31) return ''

        const iso = `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`
        const test = new Date(iso)

        if (isNaN(test.getTime())) return ''
        // Extra safety: ensure date matches (catches Feb 30, etc.)
        if (test.getUTCDate() !== d || test.getUTCMonth() + 1 !== m) return ''
        return iso
      }

      // Already ISO (date or datetime)
      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/)
      if (isoMatch) {
        const [, y, m, d] = isoMatch
        const iso = `${y}-${m}-${d}`
        const test = new Date(iso)
        if (isNaN(test.getTime())) return ''
        return iso
      }

      // Anything else (incomplete/unsupported) → treat as empty so we don't store garbage
      return ''
    }

    // Keep display in sync with external `value` whenever we're NOT typing
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatDateDisplay(value || ''))
      }
    }, [value, isFocused])

    // Calculate calendar position
    const updatePosition = () => {
      const element = inputRef.current || containerRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const calendarHeight = 350

      const shouldFlipToTop = spaceBelow < calendarHeight && rect.top > spaceBelow

      setDropdownPos({
        top: shouldFlipToTop
          ? rect.top + window.scrollY - calendarHeight - 4
          : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    }

    // Update position when opening
    useEffect(() => {
      if (isOpen) {
        updatePosition()
      }
    }, [isOpen])

    // Update position on scroll/resize while open
    useEffect(() => {
      if (!isOpen) return

      const handleScroll = () => updatePosition()
      const handleResize = () => updatePosition()

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }, [isOpen])

    // Close on outside click
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          (!calendarRef.current || !calendarRef.current.contains(target))
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
          inputRef.current?.focus()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      setDisplayValue(input)

      if (onChange) {
        let iso = parseToISO(input)

        // Fail-safe: If user typed something non-empty but invalid, keep last valid ISO value
        // This prevents accidental data loss from incomplete/invalid typing
        if (!iso && input.trim() && value) {
          iso = value
        }

        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: iso },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    const handleInputFocus = () => {
      setIsFocused(true)
      // If coming from an external ISO value, ensure we show the formatted date
      if (!displayValue && value) {
        setDisplayValue(formatDateDisplay(value))
      }
    }

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleCalendarSelect = (date: Date | undefined) => {
      if (!date) return

      const isoDate = date.toISOString().split('T')[0]

      // Update display immediately
      setDisplayValue(formatDateDisplay(isoDate))

      // Notify form with ISO value
      if (onChange && inputRef.current) {
        const syntheticEvent = {
          target: { value: isoDate, name: props.name || '' },
          currentTarget: inputRef.current,
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }

      setIsOpen(false)
    }

    // Validate and parse selected date for calendar (use local time to avoid timezone offset)
    const selectedDate = value
      ? (() => {
          const [datePart] = value.split('T')
          const [year, month, day] = datePart.split('-').map(Number)
          if (!year || !month || !day) return undefined
          return new Date(year, month - 1, day) // Local date, no UTC offset
        })()
      : undefined

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={(el) => {
            inputRef.current = el
            if (typeof ref === 'function') ref(el)
            else if (ref) ref.current = el
          }}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          disabled={disabled}
          aria-label="Date input"
          {...props}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          icon={
            <button
              type="button"
              onClick={() => {
                if (disabled) return
                // Measure position before opening so the first render is correct (prevents flash at 0,0)
                if (!isOpen) {
                  updatePosition()
                }
                setIsOpen((open) => !open)
              }}
              aria-label="Open calendar"
              className="cursor-pointer hover:text-[var(--color-navy)] transition-colors"
              tabIndex={-1}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          }
        />

        {/* Calendar Popup */}
        {isOpen &&
          !disabled &&
          createPortal(
            <div
              ref={calendarRef}
              style={{
                position: 'absolute',
                top: `${dropdownPos.top}px`,
                left: `${dropdownPos.left}px`,
                zIndex: 9999,
              }}
              className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2"
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                locale={es}
                className="rdp-custom"
                classNames={{
                  day_button: 'rdp-day-button',
                  selected: 'rdp-selected',
                  today: 'rdp-today',
                }}
              />
              <style>{`
                .rdp-custom {
                  --rdp-accent-color: var(--color-navy);
                  --rdp-background-color: var(--color-gold);
                  font-size: 0.875rem;
                }
                .rdp-day-button {
                  border-radius: 0.5rem;
                  transition: all 0.2s;
                }
                .rdp-day-button:hover {
                  background-color: var(--color-gold);
                  color: var(--color-navy);
                }
                .rdp-selected {
                  background-color: var(--color-navy) !important;
                  color: white !important;
                  font-weight: 600;
                }
                .rdp-today {
                  font-weight: 600;
                  color: var(--color-navy);
                }
              `}</style>
            </div>,
            document.body
          )}
      </div>
    )
  }
)

DateInput.displayName = 'DateInput'
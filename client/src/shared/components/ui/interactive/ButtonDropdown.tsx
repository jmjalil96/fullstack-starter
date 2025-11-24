import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '../forms/Button'

export interface DropdownItem {
  label: string
  onClick: () => void
  icon?: ReactNode
}

interface ButtonDropdownProps {
  /** Button label */
  label: string
  /** Main action (if provided, creates split button) */
  mainAction?: () => void
  /** Dropdown menu items */
  items: DropdownItem[]
  /** Optional icon */
  icon?: ReactNode
  /** Button size (defaults to md) */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Button with dropdown menu
 * Supports two modes: split button (main + dropdown) or standard dropdown
 *
 * Features:
 * - WCAG 2.1 compliant (ARIA menu pattern, keyboard navigation)
 * - Portal dropdown (never clipped)
 * - Dynamic positioning
 * - Keyboard accessible (arrows, Enter, Escape)
 *
 * @example
 * // Split button
 * <ButtonDropdown
 *   label="Nuevo Cliente"
 *   mainAction={() => createClient()}
 *   items={[
 *     { label: 'Import', onClick: () => {} },
 *     { label: 'Export', onClick: () => {} }
 *   ]}
 * />
 *
 * // Standard dropdown
 * <ButtonDropdown
 *   label="Actions"
 *   items={[...]}
 * />
 */
export function ButtonDropdown({ label, mainAction, items, icon, size = 'md' }: ButtonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Calculate dropdown position
  const updatePosition = () => {
    if (!triggerRef.current && !containerRef.current) return

    const element = triggerRef.current || containerRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth

    // Check if dropdown would go off right edge
    const dropdownWidth = 192 // w-48 = 12rem = 192px
    const spaceRight = viewportWidth - rect.right
    const shouldFlipLeft = spaceRight < dropdownWidth && rect.left > dropdownWidth

    setDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      left: shouldFlipLeft
        ? rect.left + window.scrollX - dropdownWidth + rect.width
        : rect.right + window.scrollX - dropdownWidth,
    })
  }

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
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

  // Keyboard navigation in menu
  const handleMenuKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex < items.length - 1) {
          itemRefs.current[currentIndex + 1]?.focus()
          setHighlightedIndex(currentIndex + 1)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex > 0) {
          itemRefs.current[currentIndex - 1]?.focus()
          setHighlightedIndex(currentIndex - 1)
        }
        break
      case 'Home':
        e.preventDefault()
        itemRefs.current[0]?.focus()
        setHighlightedIndex(0)
        break
      case 'End':
        e.preventDefault()
        itemRefs.current[items.length - 1]?.focus()
        setHighlightedIndex(items.length - 1)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  const handleItemClick = (item: DropdownItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      {mainAction ? (
        // Split Button (Main + Arrow)
        <div className="flex shadow-lg shadow-[var(--color-gold)]/10 rounded-xl overflow-hidden">
          <Button onClick={mainAction} size={size} className="rounded-r-none border-r border-black/10">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </Button>
          <button
            ref={triggerRef}
            onClick={() => {
              if (!isOpen) updatePosition()
              setIsOpen(!isOpen)
            }}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label="Open menu"
            className="bg-[var(--color-gold)] hover:bg-[#c5a028] text-[var(--color-navy)] px-2 flex items-center justify-center transition-colors active:bg-[#a88a22]"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : (
        // Standard Dropdown Button
        <Button
          onClick={() => {
            if (!isOpen) updatePosition()
            setIsOpen(!isOpen)
          }}
          size={size}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      )}

      {/* Menu (Portal) */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            tabIndex={-1}
            style={{
              position: 'absolute',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 9999,
            }}
            className="w-48 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2"
          >
            <div className="py-1">
              {items.map((item, index) => (
                <button
                  key={item.label}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  role="menuitem"
                  tabIndex={highlightedIndex === index ? 0 : -1}
                  onClick={() => handleItemClick(item)}
                  onKeyDown={(e) => handleMenuKeyDown(e, index)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    highlightedIndex === index
                      ? 'bg-[var(--color-navy)] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

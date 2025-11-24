import { useRef, useEffect, type ReactNode } from 'react'

/** Sidebar item configuration */
export interface SidebarItem {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Optional icon */
  icon?: ReactNode
  /** Optional badge (count or status indicator) */
  badge?: string | number
}

/** Props for DetailSidebar component */
interface DetailSidebarProps {
  /** Array of sidebar items */
  items: SidebarItem[]
  /** Currently active item ID */
  activeId: string
  /** Callback when item is selected */
  onSelect: (id: string) => void
  /** Additional CSS classes */
  className?: string
  /** Optional footer content */
  children?: ReactNode
}

/**
 * Accessible sidebar with tab navigation
 * Implements WAI-ARIA tab pattern with full keyboard support
 *
 * @example
 * const items: SidebarItem[] = [
 *   { id: 'general', label: 'General', icon: <Icon />, badge: 5 },
 *   { id: 'history', label: 'History' }
 * ]
 *
 * <DetailSidebar
 *   items={items}
 *   activeId="general"
 *   onSelect={setActiveTab}
 * >
 *   <div>Footer content</div>
 * </DetailSidebar>
 */
export function DetailSidebar({
  items,
  activeId,
  onSelect,
  className = '',
  children,
}: DetailSidebarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Focus a tab by index (with wrapping)
  const focusTab = (index: number) => {
    const wrappedIndex = ((index % items.length) + items.length) % items.length
    tabRefs.current[wrappedIndex]?.focus()
    onSelect(items[wrappedIndex].id)
  }

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        focusTab(currentIndex - 1)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        focusTab(currentIndex + 1)
        break
      case 'Home':
        e.preventDefault()
        focusTab(0)
        break
      case 'End':
        e.preventDefault()
        focusTab(items.length - 1)
        break
    }
  }

  // Auto-focus active tab on mount
  useEffect(() => {
    const activeIndex = items.findIndex((item) => item.id === activeId)
    if (activeIndex >= 0 && tabRefs.current[activeIndex]) {
      tabRefs.current[activeIndex]?.focus()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex flex-col ${className}`}>
      <div role="tablist" aria-label="Detail sections">
        {items.map((item, index) => {
          const isActive = activeId === item.id

          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'bg-[var(--color-navy)] text-white shadow-md shadow-blue-900/20'
                    : 'text-gray-500 hover:bg-white/60 hover:text-[var(--color-navy)] hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className={`flex-shrink-0 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  aria-label={`${item.badge} items`}
                  className={`
                    px-2 py-0.5 text-xs rounded-full font-bold
                    ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
                  `}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Metadata Footer */}
      {children}
    </div>
  )
}

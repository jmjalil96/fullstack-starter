import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { mainNavItems } from './navigation'
import { isPathActive, isPathActiveExact } from './routeHelpers'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * MobileMenu - Slide-out navigation drawer for mobile devices
 * Features:
 * - Slide-in animation from left
 * - Backdrop overlay
 * - Expandable sections for submenu items
 * - Touch-optimized (min 44px tap targets)
 * - Auto-closes on route change
 * - iOS safe-area support
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  // Auto-close on route change
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const toggleSection = (path: string) => {
    setExpandedSections((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto"
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)] bg-[var(--color-navy)]">
          <span className="text-xl font-bold text-white">Capstone360°</span>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-[var(--color-navy-600)] rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="py-2">
          {mainNavItems.map((item) => {
            const isActive = isPathActive(location.pathname, item.path)
            const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0)
            const isExpanded = expandedSections.includes(item.path)

            return (
              <div key={item.path}>
                {/* Main Nav Item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSection(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-teal)] font-medium'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`block px-4 py-3 transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-teal)] font-medium border-l-4 border-[var(--color-teal)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Submenu Items */}
                {hasSubmenu && isExpanded && item.submenu && (
                  <div className="bg-[var(--color-bg-secondary)]">
                    {item.submenu.map((subItem) => {
                      const isSubActive = isPathActiveExact(location.pathname, subItem.path)
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block pl-8 pr-4 py-3 text-sm transition-colors min-h-[44px] ${
                            isSubActive
                              ? 'text-[var(--color-teal)] font-medium bg-[var(--color-bg-hover)] border-l-4 border-[var(--color-teal)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </>
  )
}

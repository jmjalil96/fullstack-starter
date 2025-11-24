import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { mainNavItems } from '../../../../config/navigation'
import { getActiveSubItem, isItemActive } from '../../../../config/routeHelpers'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * MobileMenu - Mobile drawer menu
 * Features:
 * - Glassmorphism header
 * - Clean, modern list items
 * - Smoother animations
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto animate-in slide-in-from-left duration-300"
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header with Glass Feel - MATCHING TOPNAV STYLE */}
        <div className="flex items-center justify-between px-6 py-6 bg-[var(--color-navy)]/85 backdrop-blur-md text-white border-b border-white/10 shadow-lg">
          <span className="text-2xl font-bold">
            Capstone<span className="text-[var(--color-gold)]">360°</span>
          </span>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
        <nav className="py-4 px-2 space-y-1">
          {mainNavItems.map((item) => {
            const isActive = isItemActive(location.pathname, item)
            const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0)
            const isExpanded = expandedSections.includes(item.path)

            return (
              <div key={item.path} className="overflow-hidden rounded-lg">
                {/* Main Nav Item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSection(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
                      isActive
                        ? 'bg-[var(--color-bg-secondary)] text-[var(--color-navy)] font-semibold'
                        : 'text-[var(--color-text-primary)] hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[var(--color-navy)] text-white font-medium shadow-md'
                        : 'text-[var(--color-text-primary)] hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Submenu Items */}
                {hasSubmenu && item.submenu && (
                  <div
                    className={`space-y-1 transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-96 opacity-100 pt-1 pb-2' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {item.submenu.map((subItem) => {
                      // Get the single best matching subitem for this section
                      const activeSubItem = getActiveSubItem(location.pathname, item)
                      const isSubActive = activeSubItem && activeSubItem.path === subItem.path

                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block ml-4 px-4 py-2.5 text-sm rounded-md transition-colors ${
                            isSubActive
                              ? 'bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-medium border-l-2 border-[var(--color-teal)]'
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] hover:bg-gray-50'
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

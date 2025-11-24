import { Link, useLocation } from 'react-router-dom'

import type { NavItem, NavSubItem } from '../../../../config/navigation'
import { getActiveSubItem } from '../../../../config/routeHelpers'

interface SecondaryNavProps {
  activeSection: NavItem | null
}

/**
 * SecondaryNav - Glassmorphism submenu
 * Features:
 * - Subtle glass background
 * - Pill-shaped active states
 * - Clean, modern typography
 */
export function SecondaryNav({ activeSection }: SecondaryNavProps) {
  const location = useLocation()

  // Don't render if no active section or no submenu
  if (!activeSection?.submenu || activeSection.submenu.length === 0) {
    return null
  }

  // Find the single best matching subitem
  const activeSubItem = getActiveSubItem(location.pathname, activeSection)

  return (
    <div className="relative z-40 w-full bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Scroll container with padding to prevent clipping */}
        <nav className="flex space-x-1 overflow-x-auto py-3 no-scrollbar">
          {activeSection.submenu.map((subItem: NavSubItem) => {
            // Only highlight if this is the best matching subitem
            const isActive = activeSubItem && activeSubItem.path === subItem.path

            return (
              <Link
                key={subItem.path}
                to={subItem.path}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap border
                  ${
                    isActive
                      ? 'bg-[var(--color-navy)]/85 text-white border-[var(--color-navy)]/85 shadow-md shadow-blue-900/20'
                      : 'bg-transparent text-gray-500 border-transparent hover:bg-white hover:text-[var(--color-navy)] hover:border-gray-200'
                  }
                `}
              >
                {subItem.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'

import type { NavItem } from './navigation'
import { isPathActiveExact } from './routeHelpers'

interface SecondaryNavProps {
  activeSection: NavItem | null
}

/**
 * SecondaryNav - Contextual submenu navigation
 * Displays when the active main nav item has submenu items
 * Features:
 * - Smooth height transition
 * - Teal accent for active items
 * - Responsive: horizontal on desktop, vertical on mobile
 */
export function SecondaryNav({ activeSection }: SecondaryNavProps) {
  const location = useLocation()

  // Don't render if no active section or no submenu
  if (!activeSection?.submenu || activeSection.submenu.length === 0) {
    return null
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex flex-col md:flex-row md:space-x-1 py-2">
          {activeSection.submenu.map((subItem) => {
            const isActive = isPathActiveExact(location.pathname, subItem.path)

            return (
              <Link
                key={subItem.path}
                to={subItem.path}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-[var(--color-teal)] bg-white border-b-2 border-[var(--color-teal)] md:border-b-2'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white'
                }`}
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

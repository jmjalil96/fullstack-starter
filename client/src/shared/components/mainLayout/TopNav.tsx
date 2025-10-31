import { Link, useLocation } from 'react-router-dom'

import { mainNavItems } from './navigation'
import { isPathActive } from './routeHelpers'
import { UserMenu } from './UserMenu'

interface TopNavProps {
  onMobileMenuToggle: () => void
}

/**
 * TopNav - Primary navigation bar
 * Features:
 * - Navy background with white text
 * - Logo, nav items, and user menu
 * - Gold accent for active/hover states
 * - Responsive: desktop horizontal, mobile with hamburger
 */
export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const location = useLocation()

  return (
    <nav className="bg-[var(--color-navy)] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-navy-600)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link
              to="/dashboard"
              className="text-xl font-bold hover:text-[var(--color-gold)] transition-colors"
            >
              Capstone360°
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {mainNavItems.map((item) => {
              const isActive = isPathActive(location.pathname, item.path)
              // Navigate to first submenu item if submenu exists, otherwise to item path
              const targetPath = item.submenu?.length ? item.submenu[0].path : item.path

              return (
                <Link
                  key={item.path}
                  to={targetPath}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-white bg-[var(--color-navy-600)]'
                      : 'text-gray-200 hover:text-white hover:bg-[var(--color-navy-600)]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-gold)]" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}

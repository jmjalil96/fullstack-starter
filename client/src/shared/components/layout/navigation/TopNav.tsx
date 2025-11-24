import { Link, useLocation } from 'react-router-dom'

import { mainNavItems } from '../../../../config/navigation'
import { isItemActive } from '../../../../config/routeHelpers'

import { UserMenu } from './UserMenu'

interface TopNavProps {
  onMobileMenuToggle?: () => void
}

/**
 * TopNav - Glassmorphism navigation bar
 * Features:
 * - Glassmorphism background (semi-transparent + blur)
 * - Pill-shaped navigation items
 * - Floating effect
 */
export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const location = useLocation()


  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* Glassmorphism Container */}
      <div className="bg-[var(--color-navy)]/85 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo + Mobile Menu Button */}
            <div className="flex items-center space-x-6">
              {/* Mobile Menu Button */}
              <button
                onClick={onMobileMenuToggle}
                className="md:hidden p-2 rounded-full hover:bg-white/10 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
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
                className="text-2xl font-bold text-white hover:text-[var(--color-gold)] transition-colors tracking-tight"
              >
                Capstone<span className="text-[var(--color-gold)]">360°</span>
              </Link>
            </div>

            {/* Center: Desktop Navigation (Pills) */}
            <div className="hidden md:flex items-center space-x-2 bg-black/20 p-1.5 rounded-full border border-white/5">
              {mainNavItems.map((item) => {
                const isActive = isItemActive(location.pathname, item)
                const targetPath = item.submenu?.length ? item.submenu[0].path : item.path

                return (
                  <Link
                    key={item.path}
                    to={targetPath}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-[var(--color-gold)] text-[var(--color-navy)] shadow-[0_0_15px_rgba(212,175,55,0.3)] transform scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center pl-4">
              <div className="bg-white/5 rounded-full p-1 border border-white/10">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

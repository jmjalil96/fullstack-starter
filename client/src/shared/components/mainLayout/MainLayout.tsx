import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { MobileMenu } from './MobileMenu'
import { mainNavItems } from './navigation'
import { getActiveSection } from './routeHelpers'
import { SecondaryNav } from './SecondaryNav'
import { TopNav } from './TopNav'

/**
 * MainLayout - Primary application layout
 * Features:
 * - TopNav with logo, nav items, and user menu
 * - SecondaryNav for contextual submenus
 * - MobileMenu for mobile navigation
 * - Body scroll lock when mobile menu is open
 * - Responsive design
 */
export function MainLayout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Determine active section based on current route
  const activeSection = getActiveSection(location.pathname, mainNavItems)

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* Top Navigation */}
      <TopNav onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Secondary Navigation (conditional) */}
      <SecondaryNav activeSection={activeSection} />

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

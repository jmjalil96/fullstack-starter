import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { mainNavItems } from '../../../config/navigation'
import { getActiveSection } from '../../../config/routeHelpers'
import { MobileMenu } from '../navigation/MobileMenu'
import { SecondaryNav } from '../navigation/SecondaryNav'
import { TopNav } from '../navigation/TopNav'

/**
 * MainLayout - Glassmorphism redesigned layout
 *
 * Features:
 * - TopNav with glassmorphism and pill navigation
 * - SecondaryNav with subtle glass and pill submenus
 * - MobileMenu for mobile navigation
 * - Cleaner, more modern design language
 */
export function MainLayout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get active section to determine which submenu to show
  const activeSection = getActiveSection(location.pathname, mainNavItems)

  // Prevent body scroll when mobile menu open
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Secondary Navigation */}
      <SecondaryNav activeSection={activeSection} />

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

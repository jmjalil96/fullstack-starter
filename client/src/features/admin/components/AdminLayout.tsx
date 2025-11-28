import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { AdminMobileMenu } from './AdminMobileMenu'

/**
 * Admin navigation items
 */
const adminNavItems = [
  { label: 'Aseguradoras', path: '/admin/aseguradoras' },
  { label: 'Empleados', path: '/admin/empleados' },
  { label: 'Agentes', path: '/admin/agentes' },
  { label: 'Usuarios', path: '/admin/usuarios' },
]

/**
 * AdminLayout - Standalone admin panel layout with sidebar navigation
 *
 * Completely separate from the main app layout (no TopNav/SecondaryNav).
 * Features glassmorphism styling consistent with the main app.
 */
export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header - only visible on mobile */}
      <header className="md:hidden sticky top-0 z-20 bg-[var(--color-navy)]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Abrir menú"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="text-white font-bold">
          Panel de <span className="text-[var(--color-gold)]">Admin</span>
        </span>
        <Link
          to="/dashboard"
          className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Volver a la aplicación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
      </header>

      {/* Mobile Menu */}
      <AdminMobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Sidebar - Glassmorphism (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-[var(--color-navy)]/85 backdrop-blur-md border-r border-white/10 text-white flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">
            Panel de <span className="text-[var(--color-gold)]">Administración</span>
          </h1>
        </div>

        {/* Navigation - Pill container */}
        <nav className="flex-1 p-4">
          <div className="bg-black/20 p-2 rounded-2xl border border-white/5">
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-[var(--color-gold)] text-[var(--color-navy)] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer - Back to App */}
        <div className="p-4 border-t border-white/10">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a la aplicación
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

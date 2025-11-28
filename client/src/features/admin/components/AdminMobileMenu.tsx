import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

/**
 * Admin navigation items - matching AdminLayout
 */
const adminNavItems = [
  { label: 'Aseguradoras', path: '/admin/aseguradoras' },
  { label: 'Empleados', path: '/admin/empleados' },
  { label: 'Agentes', path: '/admin/agentes' },
  { label: 'Usuarios', path: '/admin/usuarios' },
]

interface AdminMobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * AdminMobileMenu - Mobile drawer menu for admin panel
 *
 * Features:
 * - Glassmorphism header matching AdminLayout
 * - Pill navigation matching AdminLayout desktop sidebar
 * - Auto-close on route change
 * - Smooth slide-in animation
 */
export function AdminMobileMenu({ isOpen, onClose }: AdminMobileMenuProps) {
  const location = useLocation()

  // Auto-close on route change
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

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
        className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[var(--color-navy)]/95 backdrop-blur-md z-50 shadow-2xl md:hidden overflow-y-auto animate-in slide-in-from-left duration-300"
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">
            Panel de <span className="text-[var(--color-gold)]">Administración</span>
          </h1>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Cerrar menú"
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

        {/* Navigation - Pill container (matching AdminLayout desktop sidebar) */}
        <nav className="p-4">
          <div className="bg-black/20 p-2 rounded-2xl border border-white/5">
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[var(--color-navy)]/95">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
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
      </div>
    </>
  )
}

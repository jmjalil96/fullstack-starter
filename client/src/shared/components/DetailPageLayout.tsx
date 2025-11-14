/**
 * DetailPageLayout - Reusable layout for entity detail pages with tab navigation
 *
 * Features:
 * - Vertical pill sidebar navigation (desktop)
 * - Dropdown select navigation (mobile)
 * - Active tab detection from URL
 * - Count badges in tabs
 * - Responsive design (lg breakpoint)
 * - Sticky sidebar
 */

import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import type { DetailTab } from '../utils/detailTabs'

/**
 * Props for DetailPageLayout component
 */
interface DetailPageLayoutProps {
  /** Page title (e.g., entity name) */
  title: string
  /** Optional subtitle (e.g., ID or description) */
  subtitle?: string
  /** Optional badge component (e.g., StatusBadge, TypeBadge) */
  badge?: React.ReactNode
  /** Tab configuration array */
  tabs: DetailTab[]
  /** Base path for this detail page (e.g., '/clientes/afiliados/abc123') */
  basePath: string
  /** Page content (tab content) */
  children: React.ReactNode
  /** Optional action buttons (e.g., Edit, Delete) */
  actions?: React.ReactNode
}

/**
 * DetailPageLayout - Wrapper component for entity detail pages
 *
 * Provides consistent layout with tab navigation (sidebar on desktop, dropdown on mobile).
 * Detects active tab from URL and highlights accordingly.
 *
 * @example
 * <DetailPageLayout
 *   title="Juan Pérez"
 *   subtitle="ID: abc123"
 *   badge={<TypeBadge type="OWNER" />}
 *   tabs={getAffiliateTabs(affiliate, { policies: 3, claims: 5 })}
 *   basePath="/clientes/afiliados/abc123"
 *   actions={<Button onClick={handleEdit}>Editar</Button>}
 * >
 *   <Routes>
 *     <Route index element={<AffiliateOverviewTab />} />
 *     <Route path="polizas" element={<AffiliatePoliciesTab />} />
 *   </Routes>
 * </DetailPageLayout>
 */
export function DetailPageLayout({
  title,
  subtitle,
  badge,
  tabs,
  basePath,
  children,
  actions,
}: DetailPageLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Normalize basePath (remove trailing slashes)
  const normalizedBase = useMemo(() => basePath.replace(/\/+$/, ''), [basePath])

  const currentPath = location.pathname

  // Compute active tab path
  const activePath = useMemo(() => {
    // Build candidate paths for each tab
    const candidates = tabs.map((t) => `${normalizedBase}${t.path ? `/${t.path}` : ''}`)

    // Prefer exact match first
    const exact = candidates.find((p) => p === currentPath)
    if (exact) return exact

    // Fallback: find path that current path starts with (handles nested sub-routes)
    return candidates.find((p) => currentPath.startsWith(p)) ?? normalizedBase
  }, [currentPath, tabs, normalizedBase])

  // Handle mobile dropdown change
  const onSelectMobile = (value: string) => navigate(value)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Pill Sidebar (Desktop) */}
        <nav className="hidden lg:block w-48 sticky top-6 self-start">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const href = `${normalizedBase}${tab.path ? `/${tab.path}` : ''}`
              const isActive = href === activePath

              return (
                <li key={href}>
                  <button
                    onClick={() => navigate(href)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-[var(--color-teal)] text-white shadow'
                        : 'text-[var(--color-navy)] hover:bg-gray-50'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {tab.icon ? <tab.icon className="w-4 h-4" /> : null}
                      {tab.label}
                    </span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`ml-3 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Mobile Dropdown */}
        <div className="lg:hidden w-full">
          <label htmlFor="detail-tab-select" className="sr-only">
            Secciones
          </label>
          <select
            id="detail-tab-select"
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent"
            value={activePath}
            onChange={(e) => onSelectMobile(e.target.value)}
          >
            {tabs.map((tab) => {
              const href = `${normalizedBase}${tab.path ? `/${tab.path}` : ''}`
              const label =
                typeof tab.count === 'number' ? `${tab.label} (${tab.count})` : tab.label

              return (
                <option key={href} value={href}>
                  {label}
                </option>
              )
            })}
          </select>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}

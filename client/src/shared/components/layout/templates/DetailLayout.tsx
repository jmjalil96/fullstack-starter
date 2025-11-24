import type { ReactNode } from 'react'

interface DetailLayoutProps {
  /** The PageHeader component */
  header: ReactNode
  /** The DetailSidebar component */
  sidebar: ReactNode
  /** The main content (DetailSections) */
  children: ReactNode
}

/**
 * DetailLayout - Standard layout for detail pages (Client, Claim, Policy)
 *
 * Layout:
 * - Header (Top, contained in glass)
 * - Grid:
 *   - Sidebar (Left, sticky on desktop, glass container)
 *   - Content (Right, scrollable)
 */
export function DetailLayout({ header, sidebar, children }: DetailLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Contained Header */}
        <header className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm">
          {header}
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Container (Glass) */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-6 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-4 shadow-sm">
              {sidebar}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

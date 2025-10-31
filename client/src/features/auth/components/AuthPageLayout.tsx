import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthPageLayoutProps {
  /** Page content (form, success message, etc.) */
  children: ReactNode
  /** Optional back link configuration */
  backLink?: {
    to: string
    label: string
  }
  /** Whether to show Capstone360° logo at top of card */
  showLogo?: boolean
}

/**
 * AuthPageLayout - Shared layout for all authentication pages
 * Features:
 * - Light gray background
 * - Centered white card
 * - Optional back navigation link
 * - Optional logo display
 * - Consistent spacing and responsive design
 */
export function AuthPageLayout({ children, backLink, showLogo = true }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        {backLink && (
          <div className="mb-6 text-center">
            <Link
              to={backLink.to}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] transition-colors"
            >
              ← {backLink.label}
            </Link>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          {showLogo && (
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-[var(--color-navy)]">Capstone360°</h2>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}

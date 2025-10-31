interface AuthErrorBannerProps {
  /** Error message to display (null/undefined will not render anything) */
  error: string | null | undefined
}

/**
 * AuthErrorBanner - Displays error messages in authentication flows
 * Features:
 * - Red background with error icon
 * - Conditional rendering (returns null if no error)
 * - Consistent styling across all auth pages
 */
export function AuthErrorBanner({ error }: AuthErrorBannerProps) {
  if (!error) return null

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <svg
        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-red-800">{error}</p>
    </div>
  )
}

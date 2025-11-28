/**
 * useMediaQuery - Hook for responsive JavaScript-based rendering
 *
 * Uses window.matchMedia to detect screen size changes and trigger re-renders.
 * Useful when you need to conditionally render components (not just hide with CSS)
 * to prevent unnecessary mounting and API calls.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)')
 * return isMobile ? <MobileView /> : <DesktopView />
 */

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR safety check
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // Set initial value (in case it changed between render and effect)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

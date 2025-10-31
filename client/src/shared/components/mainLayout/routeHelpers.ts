/**
 * Route helper utilities
 * Functions to determine active navigation state and manage route matching
 */

import type { NavItem } from './navigation'

/**
 * Normalizes a pathname by removing trailing slashes and query parameters
 *
 * @example
 * normalizePathname('/dashboard/') => '/dashboard'
 * normalizePathname('/dashboard?tab=overview') => '/dashboard'
 * normalizePathname('/dashboard/?tab=overview') => '/dashboard'
 */
export function normalizePathname(pathname: string): string {
  // Remove query string
  const pathWithoutQuery = pathname.split('?')[0]
  // Remove trailing slash (but keep root /)
  return pathWithoutQuery === '/' ? pathWithoutQuery : pathWithoutQuery.replace(/\/$/, '')
}

/**
 * Finds the active navigation section based on current pathname
 * Uses startsWith logic to match base paths
 *
 * @example
 * getActiveSection('/dashboard', navItems) => { label: 'Inicio', path: '/dashboard' }
 * getActiveSection('/reclamos/nuevo', navItems) => { label: 'Reclamos', path: '/reclamos', submenu: [...] }
 * getActiveSection('/unknown', navItems) => null
 */
export function getActiveSection(pathname: string, navItems: NavItem[]): NavItem | null {
  const normalized = normalizePathname(pathname)

  // Find exact match first
  const exactMatch = navItems.find((item) => normalizePathname(item.path) === normalized)
  if (exactMatch) {
    return exactMatch
  }

  // Find parent section by checking if pathname starts with any nav item path
  // Sort by path length descending to match most specific path first
  const sortedItems = [...navItems].sort((a, b) => b.path.length - a.path.length)

  for (const item of sortedItems) {
    const itemPath = normalizePathname(item.path)
    if (normalized.startsWith(itemPath)) {
      return item
    }
  }

  return null
}

/**
 * Checks if a navigation item has a submenu
 */
export function hasSubmenu(navItem: NavItem | null): boolean {
  return Boolean(navItem?.submenu && navItem.submenu.length > 0)
}

/**
 * Checks if a path is active (exact match or starts with path)
 * Useful for highlighting active links in parent navigation
 *
 * @example
 * isPathActive('/reclamos/nuevo', '/reclamos') => true
 * isPathActive('/reclamos', '/casos') => false
 */
export function isPathActive(currentPath: string, targetPath: string): boolean {
  const normalizedCurrent = normalizePathname(currentPath)
  const normalizedTarget = normalizePathname(targetPath)

  // Exact match
  if (normalizedCurrent === normalizedTarget) {
    return true
  }

  // Check if current path starts with target path (for parent nav items)
  return normalizedCurrent.startsWith(normalizedTarget + '/')
}

/**
 * Checks if a path is active with exact match only
 * Used for submenu items to prevent false positives
 *
 * @example
 * isPathActiveExact('/clientes/lista', '/clientes/lista') => true
 * isPathActiveExact('/clientes/polizas', '/clientes') => false
 */
export function isPathActiveExact(currentPath: string, targetPath: string): boolean {
  const normalizedCurrent = normalizePathname(currentPath)
  const normalizedTarget = normalizePathname(targetPath)

  return normalizedCurrent === normalizedTarget
}

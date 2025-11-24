/**
 * Route helper utilities
 * Functions to determine active navigation state and manage route matching
 */

import { matchPath } from 'react-router-dom'

import type { NavItem, NavSubItem } from './navigation'

type MatchableItem = { path: string; match?: string[] }

/**
 * Check if a nav item (section or submenu) is active for the current pathname.
 * Uses `match` patterns if provided, otherwise falls back to its `path`.
 */
export function isItemActive(pathname: string, item: MatchableItem): boolean {
  const patterns = item.match && item.match.length > 0 ? item.match : [item.path]

  return patterns.some((pattern) => {
    // Use matchPath with end: false to allow partial matches for wildcards
    const match = matchPath({ path: pattern, end: false }, pathname)
    return match !== null
  })
}

/**
 * Finds the active navigation section based on current pathname
 * Uses match patterns if defined, otherwise falls back to path
 *
 * @example
 * getActiveSection('/dashboard', navItems) => { label: 'Inicio', path: '/dashboard' }
 * getActiveSection('/polizas', navItems) => { label: 'Clientes', ... }
 * getActiveSection('/afiliados/123', navItems) => { label: 'Clientes', ... }
 */
export function getActiveSection(pathname: string, navItems: NavItem[]): NavItem | null {
  for (const item of navItems) {
    if (isItemActive(pathname, item)) {
      return item
    }
  }
  return null
}

/**
 * Finds the active submenu item for the current pathname
 * With flat URLs, no complex scoring needed - just find the matching path
 *
 * @example
 * getActiveSubItem('/polizas', clientsSection) => { label: 'Pólizas', path: '/polizas' }
 * getActiveSubItem('/clientes/123', clientsSection) => { label: 'Clientes', path: '/clientes' }
 */
export function getActiveSubItem(pathname: string, section: NavItem | null): NavSubItem | null {
  if (!section?.submenu || section.submenu.length === 0) return null

  // Simple matching - just find the submenu item whose path matches
  return section.submenu.find(subItem => {
    // Use matchPath with end: false to match both list and detail routes
    return matchPath({ path: subItem.path, end: false }, pathname) !== null
  }) ?? null
}

/**
 * Checks if a navigation item has a submenu
 */
export function hasSubmenu(navItem: NavItem | null): boolean {
  return Boolean(navItem?.submenu && navItem.submenu.length > 0)
}

/**
 * Checks if a path is active (exact match or starts with path)
 * Delegates to matchPath for consistency
 *
 * @example
 * isPathActive('/reclamos/nuevo', '/reclamos') => true
 * isPathActive('/reclamos', '/casos') => false
 */
export function isPathActive(currentPath: string, targetPath: string): boolean {
  return !!matchPath({ path: targetPath, end: false }, currentPath)
}

/**
 * Checks if a path is active with exact match only
 * Delegates to matchPath for consistency
 *
 * @example
 * isPathActiveExact('/clientes', '/clientes') => true
 * isPathActiveExact('/clientes/123', '/clientes') => false
 */
export function isPathActiveExact(currentPath: string, targetPath: string): boolean {
  return !!matchPath({ path: targetPath, end: true }, currentPath)
}

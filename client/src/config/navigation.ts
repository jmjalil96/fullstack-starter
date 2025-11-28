/**
 * Navigation configuration for the application
 * Defines main navigation items, submenus, and user menu
 */

export interface NavItem {
  /** Display label */
  label: string
  /** Default route to navigate when clicking the item */
  path: string
  /** Optional route patterns used to consider this item "active" */
  match?: string[]
  /** Optional submenu items */
  submenu?: NavSubItem[]
}

export interface NavSubItem {
  /** Display label */
  label: string
  /** Route path */
  path: string
  /** Optional route patterns for active detection (list + detail) */
  match?: string[]
}

export interface UserMenuItem {
  /** Display label */
  label: string
  /** Click handler or path */
  action: 'profile' | 'settings' | 'admin' | 'logout'
  /** Whether this item should have a divider above it */
  divider?: boolean
}

/**
 * Main navigation items
 */
export const mainNavItems: NavItem[] = [
  {
    label: 'Inicio',
    path: '/dashboard',
    match: ['/dashboard'],
  },
  {
    label: 'Reclamos',
    path: '/reclamos/nuevo',
    match: ['/reclamos', '/reclamos/*'],
    submenu: [
      {
        label: 'Nuevo Reclamo',
        path: '/reclamos/nuevo',
        match: ['/reclamos/nuevo']
      },
      {
        label: 'Ver Reclamos',
        path: '/reclamos',
        match: ['/reclamos', '/reclamos/:id']
      },
    ],
  },
  {
    label: 'Clientes',
    path: '/clientes',
    // Match any of the four main modules under the "Clientes" hub
    match: ['/clientes', '/polizas', '/afiliados', '/facturas'],
    submenu: [
      {
        label: 'Clientes',
        path: '/clientes',
        // No need for complex match arrays - matchPath with end:false handles it
      },
      {
        label: 'Pólizas',
        path: '/polizas',
      },
      {
        label: 'Afiliados',
        path: '/afiliados',
      },
      {
        label: 'Facturas',
        path: '/facturas',
      },
    ],
  },
  {
    label: 'Centro de Resolución',
    path: '/casos/mis-casos',
    match: ['/casos/*'],
    submenu: [
      {
        label: 'Mis Casos',
        path: '/casos/mis-casos',
        match: ['/casos/mis-casos', '/casos/:id']
      },
      {
        label: 'Casos Abiertos',
        path: '/casos/abiertos',
        match: ['/casos/abiertos']
      },
    ],
  },
  {
    label: 'Biblioteca',
    path: '/biblioteca',
    match: ['/biblioteca'],
  },
  {
    label: 'CapstoneAI*',
    path: '/capstone-ai',
    match: ['/capstone-ai'],
  },
]

/**
 * User menu items
 */
export const userMenuItems: UserMenuItem[] = [
  { label: 'Perfil', action: 'profile' },
  { label: 'Configuración', action: 'settings' },
  { label: 'Panel de Administración', action: 'admin', divider: true },
  { label: 'Cerrar Sesión', action: 'logout', divider: true },
]

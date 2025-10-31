/**
 * Navigation configuration for the application
 * Defines main navigation items, submenus, and user menu
 */

export interface NavItem {
  /** Display label */
  label: string
  /** Route path */
  path: string
  /** Optional submenu items */
  submenu?: NavSubItem[]
}

export interface NavSubItem {
  /** Display label */
  label: string
  /** Route path */
  path: string
}

export interface UserMenuItem {
  /** Display label */
  label: string
  /** Click handler or path */
  action: 'profile' | 'settings' | 'logout'
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
  },
  {
    label: 'Reclamos',
    path: '/reclamos',
    submenu: [
      { label: 'Nuevo Reclamo', path: '/reclamos/nuevo' },
      { label: 'Mis Reclamos', path: '/reclamos/mis-reclamos' },
      { label: 'Necesitan Atención', path: '/reclamos/atencion' },
    ],
  },
  {
    label: 'Clientes',
    path: '/clientes',
    submenu: [
      { label: 'Lista de Clientes', path: '/clientes/lista' },
      { label: 'Pólizas', path: '/clientes/polizas' },
      { label: 'Afiliados', path: '/clientes/afiliados' },
    ],
  },
  {
    label: 'Centro de Resolución',
    path: '/casos',
    submenu: [
      { label: 'Nuevo Caso', path: '/casos/nuevo' },
      { label: 'Mis Casos', path: '/casos/mis-casos' },
      { label: 'Casos Abiertos', path: '/casos/abiertos' },
    ],
  },
  {
    label: 'Biblioteca',
    path: '/biblioteca',
  },
  {
    label: 'CapstoneAI*',
    path: '/capstone-ai',
  },
]

/**
 * User menu items
 */
export const userMenuItems: UserMenuItem[] = [
  { label: 'Perfil', action: 'profile' },
  { label: 'Configuración', action: 'settings' },
  { label: 'Cerrar Sesión', action: 'logout', divider: true },
]

/**
 * Clientes - Thin page wrapper for clients list view
 */

import { ClientsListView } from '../../features/clients/views/ClientsListView'

/**
 * Clientes page - Delegates to ClientsListView
 */
export function Clientes() {
  return <ClientsListView />
}

/**
 * ClienteDetalle - Thin page wrapper for client detail view
 */

import { useParams } from 'react-router-dom'

import { ClientDetailView } from '../../features/clients/detail/ClientDetailView'

/**
 * ClienteDetalle page - Delegates to ClientDetailView
 * Extracts clientId from route params
 */
export function ClienteDetalle() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">ID de cliente no proporcionado</p>
      </div>
    )
  }

  return <ClientDetailView clientId={id} />
}

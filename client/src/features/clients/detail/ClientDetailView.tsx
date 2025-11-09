/**
 * ClientDetailView - Main view for client detail page
 * Orchestrates display components and modals
 */

import { useState } from 'react'

import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetClientDetail } from '../../../shared/hooks/clients/useGetClientDetail'

import {
  ClientActionsCard,
  ClientDetailsCard,
  ClientHeader,
  ClientMetadataCard,
  EditClientModal,
} from './components'

/**
 * Props for ClientDetailView component
 */
interface ClientDetailViewProps {
  /** Client ID from route params */
  clientId: string
}

/**
 * ClientDetailView - Complete client detail page orchestrator
 *
 * Features:
 * - Fetches and displays client data
 * - 2-column layout (main + sidebar)
 * - Edit modal (large, all fields)
 * - Loading/error states
 * - Auto-refetch after updates
 *
 * @example
 * function ClienteDetallePage() {
 *   const { id } = useParams()
 *   return <ClientDetailView clientId={id!} />
 * }
 */
export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  // Fetch client data
  const { client, loading, error, refetch } = useGetClientDetail(clientId)

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Loading state (initial load only)
  if (loading && !client) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">Error al cargar cliente</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // No client found (shouldn't happen after loading, but defensive)
  if (!client) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 mb-4">Cliente no encontrado</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header: Client name, taxId, badge */}
      <ClientHeader client={client} />

      {/* Main Layout: 2-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main content (2/3) */}
        <div className="lg:col-span-2">
          <ClientDetailsCard client={client} />
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Actions Card (edit button) */}
          <ClientActionsCard
            onEdit={() => setEditModalOpen(true)}
          />

          {/* Metadata Card (created/updated dates) */}
          <ClientMetadataCard client={client} />
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Modal - Large modal with all fields */}
      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        client={client}
        onSuccess={() => {
          setEditModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}

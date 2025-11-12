/**
 * ClientDetailView - Main view for client detail page
 * Orchestrates display components and modals
 */

import { useState } from 'react'

import { useGetClientDetail } from '../../../shared/hooks/clients/useGetClientDetail'

import {
  ClientActionsCard,
  ClientDetailsCard,
  ClientDetailSkeleton,
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
  const { client, error, refetch } = useGetClientDetail(clientId)

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Loading state - show skeleton layout
  if (!client && !error) {
    return <ClientDetailSkeleton />
  }

  // Error state (includes 404 not found)
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

  // TypeScript guard - client exists at this point
  if (!client) return null

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
      {editModalOpen && (
        <EditClientModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          client={client}
          onSuccess={() => {
            setEditModalOpen(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

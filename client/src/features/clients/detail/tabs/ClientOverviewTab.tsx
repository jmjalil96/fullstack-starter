/**
 * ClientOverviewTab - Overview tab for client detail page
 * Contains all detail cards and edit functionality
 */

import { useState } from 'react'

import type { ClientDetailResponse } from '../../../../shared/types/clients'
import {
  ClientActionsCard,
  ClientDetailsCard,
  ClientMetadataCard,
  EditClientModal,
} from '../components'

/**
 * Props for ClientOverviewTab component
 */
interface ClientOverviewTabProps {
  /** Client data to display */
  client: ClientDetailResponse
  /** Callback to refetch client data after updates */
  onRefetch: () => void
}

/**
 * ClientOverviewTab - Overview tab content for client detail
 *
 * Features:
 * - 2-column layout (main + sidebar)
 * - Client details card (main content)
 * - Actions card with edit button
 * - Metadata card with timestamps
 * - Edit modal (large, all fields)
 *
 * @example
 * <ClientOverviewTab
 *   client={clientData}
 *   onRefetch={refetch}
 * />
 */
export function ClientOverviewTab({ client, onRefetch }: ClientOverviewTabProps) {
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Handle edit success - close modal and refetch data
  const handleEditSuccess = () => {
    setEditModalOpen(false)
    onRefetch()
  }

  return (
    <>
      {/* Main Layout: 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}

/**
 * ClaimOverviewTab - Overview tab content for claim detail page
 * Contains workflow stepper, detail cards, actions, and modals
 */

import { useState } from 'react'

import { useUpdateClaim } from '../../../../shared/hooks/claims/useUpdateClaim'
import type { ClaimDetailResponse, ClaimStatus } from '../../../../shared/types/claims'
import {
  ClaimActionsCard,
  ClaimDetailsCard,
  EditClaimModal,
  ClaimMetadataCard,
  StatusTransitionModal,
  WorkflowStepper,
} from '../components'

/**
 * Props for ClaimOverviewTab component
 */
interface ClaimOverviewTabProps {
  /** Claim data to display */
  claim: ClaimDetailResponse
  /** Callback to refetch claim data after updates */
  onRefetch: () => void
}

/**
 * ClaimOverviewTab - Main overview content for claim detail
 *
 * Features:
 * - Workflow stepper (visual progress)
 * - 2-column layout (main + sidebar)
 * - Edit modal (large, all fields)
 * - Status transition modal (with requirements)
 * - Auto-refetch after updates
 *
 * @example
 * <ClaimOverviewTab claim={claim} onRefetch={refetch} />
 */
export function ClaimOverviewTab({ claim, onRefetch }: ClaimOverviewTabProps) {
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [statusTransitionModalOpen, setStatusTransitionModalOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<ClaimStatus | null>(null)

  // Update mutation
  const { updateClaim, loading: updating } = useUpdateClaim({
    onSuccess: () => {
      setStatusTransitionModalOpen(false)
      setSelectedTransition(null)
      onRefetch()
    },
  })

  /**
   * Handle status transition confirmation
   */
  const handleStatusTransition = async () => {
    if (!selectedTransition || !claim) return
    await updateClaim(claim.id, { status: selectedTransition })
  }

  return (
    <div>
      {/* Workflow Stepper: Visual progress */}
      <WorkflowStepper currentStatus={claim.status} />

      {/* Main Layout: 2-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main content (2/3) */}
        <div className="lg:col-span-2">
          <ClaimDetailsCard claim={claim} />
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Actions Card (edit, status transitions) */}
          <ClaimActionsCard
            currentStatus={claim.status}
            onEdit={() => setEditModalOpen(true)}
            onStatusChange={(status) => {
              setSelectedTransition(status)
              setStatusTransitionModalOpen(true)
            }}
          />

          {/* Metadata Card (created by, dates) */}
          <ClaimMetadataCard claim={claim} />
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Modal - Large modal with all fields */}
      {editModalOpen && (
        <EditClaimModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          claim={claim}
          onSuccess={() => {
            setEditModalOpen(false)
            onRefetch()
          }}
        />
      )}

      {/* Status Transition Modal - Confirmation with requirements */}
      {selectedTransition && (
        <StatusTransitionModal
          isOpen={statusTransitionModalOpen}
          onClose={() => {
            setStatusTransitionModalOpen(false)
            setSelectedTransition(null)
          }}
          claim={claim}
          targetStatus={selectedTransition}
          onConfirm={handleStatusTransition}
          loading={updating}
        />
      )}
    </div>
  )
}

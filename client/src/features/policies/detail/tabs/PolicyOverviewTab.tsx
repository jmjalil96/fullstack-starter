/**
 * PolicyOverviewTab - Overview tab for policy detail page
 * Displays policy details, actions, and metadata in 2-column layout
 */

import { useState } from 'react'

import { useUpdatePolicy } from '../../../../shared/hooks/policies/useUpdatePolicy'
import type { PolicyDetailResponse, PolicyStatus } from '../../../../shared/types/policies'
import {
  WorkflowStepper,
  PolicyDetailsCard,
  PolicyActionsCard,
  PolicyMetadataCard,
  EditPolicyModal,
  StatusTransitionModal,
} from '../components'

/**
 * Props for PolicyOverviewTab component
 */
interface PolicyOverviewTabProps {
  /** Policy data to display */
  policy: PolicyDetailResponse
  /** Callback to refetch policy data after updates */
  onRefetch: () => void
}

/**
 * PolicyOverviewTab - Policy overview tab content
 *
 * Features:
 * - Workflow stepper showing lifecycle state
 * - 2-column layout (main + sidebar)
 * - Edit modal (large, all fields)
 * - Status transition modal (with requirements)
 * - Auto-refetch after updates
 *
 * @example
 * <PolicyOverviewTab policy={policy} onRefetch={refetch} />
 */
export function PolicyOverviewTab({ policy, onRefetch }: PolicyOverviewTabProps) {
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [statusTransitionModalOpen, setStatusTransitionModalOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<PolicyStatus | null>(null)

  // Update mutation
  const { updatePolicy, loading: updating } = useUpdatePolicy({
    onSuccess: () => {
      setStatusTransitionModalOpen(false)
      setSelectedTransition(null)
      onRefetch()
    },
  })

  /**
   * Handle edit button click
   */
  const handleEdit = () => {
    setEditModalOpen(true)
  }

  /**
   * Handle status transition button click
   */
  const handleStatusTransition = (status: PolicyStatus) => {
    setSelectedTransition(status)
    setStatusTransitionModalOpen(true)
  }

  /**
   * Handle status transition confirmation
   */
  const handleConfirmTransition = async () => {
    if (!selectedTransition || !policy) return
    await updatePolicy(policy.id, { status: selectedTransition })
  }

  return (
    <div>
      {/* Workflow Stepper */}
      <WorkflowStepper currentStatus={policy.status} />

      {/* Main Layout: 2-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main content (2/3) */}
        <div className="lg:col-span-2">
          <PolicyDetailsCard policy={policy} />
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Actions Card (edit, status transitions) */}
          <PolicyActionsCard
            currentStatus={policy.status}
            onEdit={handleEdit}
            onStatusTransition={handleStatusTransition}
          />

          {/* Metadata Card (created by, dates) */}
          <PolicyMetadataCard policy={policy} />
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Modal - Large modal with all fields */}
      {editModalOpen && (
        <EditPolicyModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          policy={policy}
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
          policyData={policy}
          currentStatus={policy.status}
          targetStatus={selectedTransition}
          onConfirm={handleConfirmTransition}
          loading={updating}
        />
      )}
    </div>
  )
}

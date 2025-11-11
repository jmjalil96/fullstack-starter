/**
 * PolicyDetailView - Main view for policy detail page
 * Orchestrates display components and modals
 */

import { useState } from 'react'

import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetPolicyDetail } from '../../../shared/hooks/policies/useGetPolicyDetail'
import { useUpdatePolicy } from '../../../shared/hooks/policies/useUpdatePolicy'
import type { PolicyStatus } from '../../../shared/types/policies'

import {
  EditPolicyModal,
  MetadataCard,
  PolicyActionsCard,
  PolicyDetailsCard,
  PolicyHeader,
  StatusTransitionModal,
} from './components'

/**
 * Props for PolicyDetailView component
 */
interface PolicyDetailViewProps {
  /** Policy ID from route params */
  policyId: string
}

/**
 * PolicyDetailView - Complete policy detail page orchestrator
 *
 * Features:
 * - Fetches and displays policy data
 * - 2-column layout (main + sidebar)
 * - Edit modal (large, all fields)
 * - Status transition modal (with requirements)
 * - Loading/error states
 * - Auto-refetch after updates
 *
 * @example
 * function PolizaDetallePage() {
 *   const { id } = useParams()
 *   return <PolicyDetailView policyId={id!} />
 * }
 */
export function PolicyDetailView({ policyId }: PolicyDetailViewProps) {
  // Fetch policy data
  const { policy, error, refetch } = useGetPolicyDetail(policyId)

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [statusTransitionModalOpen, setStatusTransitionModalOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<PolicyStatus | null>(null)

  // Update mutation
  const { updatePolicy, loading: updating } = useUpdatePolicy({
    onSuccess: () => {
      setStatusTransitionModalOpen(false)
      setSelectedTransition(null)
      refetch()
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

  // Loading state - show spinner if no data and no error
  if (!policy && !error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Error state (includes 404 not found)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">Error al cargar póliza</p>
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

  // TypeScript guard - policy exists at this point
  if (!policy) return null

  return (
    <div>
      {/* Header: Policy number, status, back link */}
      <PolicyHeader policy={policy} />

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
          <MetadataCard policy={policy} />
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Modal - Large modal with all fields */}
      <EditPolicyModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        policy={policy}
        onSuccess={() => {
          setEditModalOpen(false)
          refetch()
        }}
      />

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

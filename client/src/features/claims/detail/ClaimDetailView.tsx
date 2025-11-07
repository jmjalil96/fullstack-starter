/**
 * ClaimDetailView - Main view for claim detail page
 * Orchestrates display components and modals
 */

import { useState } from 'react'

import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetClaimDetail } from '../../../shared/hooks/claims/useGetClaimDetail'
import { useUpdateClaim } from '../../../shared/hooks/claims/useUpdateClaim'
import type { ClaimStatus } from '../../../shared/types/claims'

import {
  ClaimActionsCard,
  ClaimDetailsCard,
  ClaimHeader,
  EditClaimModal,
  MetadataCard,
  StatusTransitionModal,
  WorkflowStepper,
} from './components'

/**
 * Props for ClaimDetailView component
 */
interface ClaimDetailViewProps {
  /** Claim ID from route params */
  claimId: string
}

/**
 * ClaimDetailView - Complete claim detail page orchestrator
 *
 * Features:
 * - Fetches and displays claim data
 * - 2-column layout (main + sidebar)
 * - Edit modal (large, all fields)
 * - Status transition modal (with requirements)
 * - Workflow stepper (visual progress)
 * - Loading/error states
 * - Auto-refetch after updates
 *
 * @example
 * function ReclamoDetallePage() {
 *   const { id } = useParams()
 *   return <ClaimDetailView claimId={id!} />
 * }
 */
export function ClaimDetailView({ claimId }: ClaimDetailViewProps) {
  // Fetch claim data
  const { claim, loading, error, refetch } = useGetClaimDetail(claimId)

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<ClaimStatus | null>(null)

  // Update mutation
  const { updateClaim, loading: updating } = useUpdateClaim({
    onSuccess: () => {
      setStatusModalOpen(false)
      setSelectedTransition(null)
      refetch()
    },
  })

  /**
   * Handle status transition confirmation
   */
  const handleStatusTransition = async () => {
    if (!selectedTransition || !claim) return
    await updateClaim(claim.id, { status: selectedTransition })
  }

  // Loading state (initial load only)
  if (loading && !claim) {
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
        <p className="text-red-800 font-medium mb-2">Error al cargar reclamo</p>
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

  // No claim found (shouldn't happen after loading, but defensive)
  if (!claim) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 mb-4">Reclamo no encontrado</p>
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
      {/* Header: Claim number, status, back link */}
      <ClaimHeader claim={claim} />

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
              setStatusModalOpen(true)
            }}
          />

          {/* Metadata Card (created by, dates) */}
          <MetadataCard claim={claim} />
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Modal - Large modal with all fields */}
      <EditClaimModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        claim={claim}
        onSuccess={() => {
          setEditModalOpen(false)
          refetch()
        }}
      />

      {/* Status Transition Modal - Confirmation with requirements */}
      {selectedTransition && (
        <StatusTransitionModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false)
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

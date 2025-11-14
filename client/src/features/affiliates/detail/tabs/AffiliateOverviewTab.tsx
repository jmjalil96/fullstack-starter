/**
 * AffiliateOverviewTab - Overview/summary tab for affiliate detail
 * Contains main detail cards and edit functionality
 */

import { useState } from 'react'

import { useUpdateAffiliate } from '../../../../shared/hooks/affiliates/useUpdateAffiliate'
import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'
import {
  AffiliateActionsCard,
  AffiliateDetailsCard,
  AffiliateMetadataCard,
  EditAffiliateModal,
  FamilyInfoCard,
} from '../components'

/**
 * Props for AffiliateOverviewTab
 */
interface AffiliateOverviewTabProps {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse
  /** Callback to refetch affiliate data after updates */
  onRefetch: () => void
}

/**
 * AffiliateOverviewTab - Main overview content for affiliate detail
 *
 * Displays all affiliate information cards and handles editing.
 *
 * @example
 * <AffiliateOverviewTab affiliate={affiliate} onRefetch={refetch} />
 */
export function AffiliateOverviewTab({ affiliate, onRefetch }: AffiliateOverviewTabProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { updateAffiliate } = useUpdateAffiliate({
    onSuccess: () => {
      onRefetch()
    },
  })

  /**
   * Handle status change (activate/deactivate)
   */
  const handleStatusChange = async (newStatus: boolean) => {
    await updateAffiliate(affiliate.id, { isActive: newStatus })
  }

  /**
   * Handle successful edit
   */
  const handleEditSuccess = () => {
    setEditModalOpen(false)
    onRefetch() // Refresh affiliate data
  }

  return (
    <>
      {/* Main Layout: 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main details card */}
          <AffiliateDetailsCard affiliate={affiliate} />

          {/* Family info card - only for dependents with primary affiliate */}
          {affiliate.affiliateType === 'DEPENDENT' && affiliate.primaryAffiliateId && (
            <FamilyInfoCard affiliate={affiliate} />
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Actions Card (edit, status change) */}
          <AffiliateActionsCard
            affiliate={affiliate}
            onEdit={() => setEditModalOpen(true)}
            onStatusChange={handleStatusChange}
          />

          {/* Metadata Card (created/updated dates) */}
          <AffiliateMetadataCard affiliate={affiliate} />
        </div>
      </div>

      {/* MODALS */}

      {/* Edit Modal - Large modal with all fields */}
      {editModalOpen && (
        <EditAffiliateModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          affiliate={affiliate}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}

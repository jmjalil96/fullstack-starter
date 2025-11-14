/**
 * AffiliateActionsCard - Sidebar card with action buttons
 * Shows edit and status toggle actions for affiliate management
 */

import { Button } from '../../../../shared/components/ui/Button'
import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'

/**
 * Props for AffiliateActionsCard component
 */
interface AffiliateActionsCardProps {
  /** Affiliate detail data */
  affiliate: AffiliateDetailResponse
  /** Callback to open edit modal */
  onEdit: () => void
  /** Callback to toggle affiliate status */
  onStatusChange: (newStatus: boolean) => void
}

/**
 * AffiliateActionsCard - Action buttons for affiliate operations
 *
 * Features:
 * - Edit button (opens edit modal)
 * - Status toggle button (Activate/Deactivate)
 * - Full-width buttons for sidebar
 * - Consistent styling with ClientActionsCard
 *
 * Note: Backend enforces permissions
 *
 * @example
 * <AffiliateActionsCard
 *   affiliate={affiliate}
 *   onEdit={() => setEditModalOpen(true)}
 *   onStatusChange={(newStatus) => handleStatusChange(newStatus)}
 * />
 */
export function AffiliateActionsCard({
  affiliate,
  onEdit,
  onStatusChange,
}: AffiliateActionsCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">Acciones</h3>

      <div className="space-y-2">
        {/* Edit Button */}
        <Button variant="secondary" className="w-full justify-center" onClick={onEdit}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar Afiliado
        </Button>

        {/* Status Toggle Button */}
        <Button
          variant={affiliate.isActive ? 'secondary' : 'primary'}
          className="w-full justify-center"
          onClick={() => onStatusChange(!affiliate.isActive)}
        >
          {affiliate.isActive ? (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              Desactivar
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Activar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

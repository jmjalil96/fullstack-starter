/**
 * ReclamoDetalle Page - Claim detail page wrapper
 * Extracts route params and delegates to feature view
 */

import { useParams } from 'react-router-dom'

import { ClaimDetailView } from '../../features/claims/detail/ClaimDetailView'

/**
 * ReclamoDetalle - Page wrapper for claim detail
 *
 * Pattern: Thin wrapper that extracts route params and delegates to feature view.
 * Feature view (ClaimDetailView) handles all logic, components, and state.
 *
 * Route: /reclamos/:id
 *
 * @example
 * // In App.tsx routes:
 * <Route path="/reclamos/:id" element={<ReclamoDetalle />} />
 */
export function ReclamoDetalle() {
  const { id } = useParams<{ id: string }>()

  // Guard: Ensure id exists (shouldn't happen with route config, but defensive)
  if (!id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">ID de reclamo no válido</p>
      </div>
    )
  }

  return <ClaimDetailView claimId={id} />
}

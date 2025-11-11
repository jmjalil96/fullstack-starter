/**
 * PolizaDetalle Page - Policy detail page wrapper
 * Extracts route params and delegates to feature view
 */

import { useParams } from 'react-router-dom'

import { PolicyDetailView } from '../../features/policies/detail/PolicyDetailView'

/**
 * PolizaDetalle - Page wrapper for policy detail
 *
 * Pattern: Thin wrapper that extracts route params and delegates to feature view.
 * Feature view (PolicyDetailView) handles all logic, components, and state.
 *
 * Route: /clientes/polizas/:id
 *
 * @example
 * // In App.tsx routes:
 * <Route path="/clientes/polizas/:id" element={<PolizaDetalle />} />
 */
export function PolizaDetalle() {
  const { id } = useParams<{ id: string }>()

  // Guard: Ensure id exists (shouldn't happen with route config, but defensive)
  if (!id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">ID de póliza no válido</p>
      </div>
    )
  }

  return <PolicyDetailView policyId={id} />
}

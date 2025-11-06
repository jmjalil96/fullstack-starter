import { MisReclamosView } from '../../features/claims/views/MisReclamosView'

export function MisReclamos() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-6">Mis Reclamos</h1>
      <MisReclamosView />
    </div>
  )
}

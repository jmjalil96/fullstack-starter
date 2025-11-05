import { NewClaimForm } from '../../features/claims/new/NewClaimForm'

export function NuevoReclamo() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-6">Nuevo Reclamo</h1>
      <NewClaimForm />
    </div>
  )
}

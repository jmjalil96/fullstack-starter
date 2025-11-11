import { NewPolicyForm } from '../../features/policies/new/NewPolicyForm'

export function NuevaPoliza() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-6">Nueva Póliza</h1>
      <NewPolicyForm />
    </div>
  )
}

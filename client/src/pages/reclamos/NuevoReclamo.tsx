export function NuevoReclamo() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-4">Nuevo Reclamo</h1>
      <div className="border-4 border-dashed border-[var(--color-border)] rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-[var(--color-text-light)] mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">
            Formulario de Nuevo Reclamo
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Esta página está en desarrollo. Aquí podrás crear nuevos reclamos.
          </p>
        </div>
      </div>
    </div>
  )
}

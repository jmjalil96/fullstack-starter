export function NuevoCaso() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-4">Nuevo Caso</h1>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">
            Crear Nuevo Caso
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Esta página está en desarrollo. Aquí podrás crear nuevos casos.
          </p>
        </div>
      </div>
    </div>
  )
}

export function MisCasos() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-4">Mis Casos</h1>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">Mis Casos</h2>
          <p className="text-[var(--color-text-secondary)]">
            Esta página está en desarrollo. Aquí verás todos tus casos.
          </p>
        </div>
      </div>
    </div>
  )
}

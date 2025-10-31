export function Biblioteca() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-4">Biblioteca</h1>
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">
            Biblioteca de Recursos
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Esta página está en desarrollo. Aquí encontrarás recursos y documentación.
          </p>
        </div>
      </div>
    </div>
  )
}

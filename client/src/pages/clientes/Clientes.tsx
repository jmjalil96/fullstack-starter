export function Clientes() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-4">Lista de Clientes</h1>
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">
            Lista de Clientes
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Esta página está en desarrollo. Aquí podrás ver la lista completa de clientes.
          </p>
        </div>
      </div>
    </div>
  )
}

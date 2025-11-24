import { DetailLayout } from '../../shared/components/layout/templates/DetailLayout'
import { DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'

export function CasosAbiertos() {
  return (
    <DetailLayout
      header={
        <PageHeader
          title="Casos Abiertos"
          breadcrumbs={[
            { label: 'Centro de Resolución', to: '/casos' },
            { label: 'Casos Abiertos' },
          ]}
        />
      }
      sidebar={<div />}
    >

      <DetailSection title="Todos los Casos Abiertos">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Casos Abiertos</h2>
            <p className="text-gray-600 leading-relaxed">
              Esta funcionalidad está en desarrollo. Aquí podrás ver todos los casos abiertos en el sistema.
            </p>
          </div>
        </div>
      </DetailSection>
    </DetailLayout>
  )
}
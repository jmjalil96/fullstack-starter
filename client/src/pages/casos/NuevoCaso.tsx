import { DetailLayout } from '../../shared/components/layout/templates/DetailLayout'
import { DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'

export function NuevoCaso() {
  return (
    <DetailLayout
      header={
        <PageHeader
          title="Nuevo Caso"
          breadcrumbs={[
            { label: 'Centro de Resolución', to: '/casos' },
            { label: 'Nuevo Caso' },
          ]}
        />
      }
      sidebar={<div />}
    >

      <DetailSection title="Crear Caso">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-blue-600"
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
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Crear Nuevo Caso
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Esta funcionalidad está en desarrollo. Pronto podrás crear y gestionar casos de resolución aquí.
            </p>
          </div>
        </div>
      </DetailSection>
    </DetailLayout>
  )
}
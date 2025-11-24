import { DetailLayout } from '../../shared/components/layout/templates/DetailLayout'
import { DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'

export function AiAssistant() {
  return (
    <DetailLayout
      header={
        <PageHeader
          title="AiAssistant"
          breadcrumbs={[
            { label: 'AiAssistant' },
          ]}
        />
      }
      sidebar={<div />}
    >

      <DetailSection title="Asistente de Inteligencia Artificial">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Asistente IA Capstone360
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Esta funcionalidad está en desarrollo. Pronto podrás interactuar con nuestro asistente de inteligencia artificial para optimizar tu flujo de trabajo.
            </p>
          </div>
        </div>
      </DetailSection>
    </DetailLayout>
  )
}
import { DetailLayout } from '../../shared/components/layout/templates/DetailLayout'
import { DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'

export function Library() {
  return (
    <DetailLayout
      header={
        <PageHeader
          title="Library"
          breadcrumbs={[
            { label: 'Library' },
          ]}
        />
      }
      sidebar={<div />}
    >

      <DetailSection title="Centro de Recursos">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-teal-600"
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
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Library de Recursos
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Esta funcionalidad está en desarrollo. Pronto podrás acceder a documentación, guías y recursos de ayuda aquí.
            </p>
          </div>
        </div>
      </DetailSection>
    </DetailLayout>
  )
}
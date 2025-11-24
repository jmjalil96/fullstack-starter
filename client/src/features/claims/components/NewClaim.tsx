import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { Button } from '../../../shared/components/ui/forms/Button'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { useToast } from '../../../shared/hooks/useToast'
import {
  useAvailableClaimAffiliates,
  useAvailableClaimClients,
  useAvailableClaimPatients,
} from '../hooks/useClaimLookups'
import { useCreateClaim } from '../hooks/useClaimMutations'
import { claimFormSchema, type ClaimFormData } from '../schemas/createClaimSchema'

import { CreateClaimForm } from './CreateClaimForm'

export function NewClaim() {
  const createMutation = useCreateClaim()
  const toast = useToast()

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    mode: 'onChange',
    defaultValues: {
      clientId: '',
      affiliateId: '',
      patientId: '',
      description: '',
    },
  })

  const { handleSubmit, setError, setFocus, reset, watch } = form

  const clientId = watch('clientId')
  const affiliateId = watch('affiliateId')

  // Fetch available options using TanStack Query
  const { data: clientList = [] } = useAvailableClaimClients()
  const { data: affiliateList = [], isLoading: loadingAffiliates } =
    useAvailableClaimAffiliates(clientId || undefined, true)
  const { data: patientList = [], isLoading: loadingPatients } = useAvailableClaimPatients(
    affiliateId || undefined,
    true
  )

  // Map to select options
  const clientOptions = clientList.map((c) => ({ value: c.id, label: c.name }))
  const affiliateOptions = affiliateList.map((a) => ({
    value: a.id,
    label: `${a.firstName} ${a.lastName}`,
  }))
  const patientOptions = patientList.map((p) => ({
    value: p.id,
    label:
      p.relationship === 'self'
        ? `${p.firstName} ${p.lastName} (Titular)`
        : `${p.firstName} ${p.lastName} (Dependiente)`,
  }))

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        affiliateId: data.affiliateId,
        patientId: data.patientId,
        description: data.description,
      })
      toast.success('Reclamo creado exitosamente')
      reset()
      // Optionally navigate to detail page once createClaim returns the created claim
      // navigate(`/v2/reclamos/${created.id}`)
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof ClaimFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        if (issues[0]) {
          const firstPath = Array.isArray(issues[0].path)
            ? issues[0].path.join('.')
            : issues[0].path
          setFocus(firstPath as keyof ClaimFormData)
        }
        return
      }
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al crear reclamo'
      toast.error(message)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Nuevo Reclamo"
        subtitle="Completa la información del reclamo. Podrás adjuntar documentos y asignar una póliza más adelante."
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Reclamos', to: '/reclamos' },
          { label: 'Nuevo Reclamo' },
        ]}
      />

      {/* Main Content */}
      <FormProvider {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Form (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <CreateClaimForm
              id="create-claim-form"
              onSubmit={onSubmit}
              clientOptions={clientOptions}
              affiliateOptions={affiliateOptions}
              patientOptions={patientOptions}
              loadingAffiliates={loadingAffiliates}
              loadingPatients={loadingPatients}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                form="create-claim-form"
                isLoading={createMutation.isPending}
                disabled={createMutation.isPending}
              >
                Crear Reclamo
              </Button>
            </div>
          </div>

          {/* Right: Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Tips Card */}
            <DetailSection title="Consejos">
              <div className="text-sm text-gray-700 space-y-3">
                <div className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <p>
                    <strong>Cliente:</strong> Selecciona la empresa titular del seguro.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <p>
                    <strong>Afiliado Titular:</strong> El dueño de la póliza (puede ser el paciente o
                    su responsable).
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <p>
                    <strong>Paciente:</strong> Quien recibió el servicio médico (puede ser el titular
                    o un dependiente).
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <p>
                    <strong>Descripción:</strong> Incluye diagnóstico, tratamiento realizado y
                    servicios recibidos.
                  </p>
                </div>
              </div>
            </DetailSection>

            {/* Document Upload Placeholder */}
            <DetailSection title="Documentos">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-500 font-medium mb-1">Adjuntar Documentos</p>
                <p className="text-xs text-gray-400">Próximamente disponible</p>
              </div>
            </DetailSection>
          </div>
        </div>
      </FormProvider>
    </div>
  )
}

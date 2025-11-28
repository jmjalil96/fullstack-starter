import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { SummaryCard } from '../../../shared/components/ui/data-display/SummaryCard'
import { FileDropzone } from '../../../shared/components/ui/files/FileDropzone'
import { FileListItem } from '../../../shared/components/ui/files/FileListItem'
import { Button } from '../../../shared/components/ui/forms/Button'
import { SearchableSelect } from '../../../shared/components/ui/forms/SearchableSelect'
import { Textarea } from '../../../shared/components/ui/forms/Textarea'
import { FormSection } from '../../../shared/components/ui/layout/FormSection'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { useToast } from '../../../shared/hooks/useToast'
import { CLAIM_FILE_CATEGORIES, type PendingFile } from '../../files/files'
import { requestPendingUploadUrl, uploadToR2 } from '../../files/filesApi'
import {
  useAvailableClaimAffiliates,
  useAvailableClaimClients,
  useAvailableClaimPatients,
} from '../hooks/useClaimLookups'
import { useCreateClaim } from '../hooks/useClaimMutations'
import { claimFormSchema, type ClaimFormData } from '../schemas/createClaimSchema'

// --- QUICK TAGS (domain-specific) ---

const QUICK_TAGS = [
  {
    label: 'Consulta Médica',
    text: 'Consulta médica realizada.\nDiagnóstico: ',
  },
  {
    label: 'Medicamentos',
    text: 'Compra de medicamentos según receta adjunta.\nFarmacia: ',
  },
  {
    label: 'Estudios',
    text: 'Estudios de laboratorio realizados.\nResultados: ',
  },
]

function DescriptionField() {
  const { control, setValue, getValues } = useFormContext<ClaimFormData>()

  const insertTag = (text: string) => {
    const current = getValues('description') || ''
    setValue('description', current + (current ? '\n\n' : '') + text, {
      shouldDirty: true,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => insertTag(tag.text)}
            className="flex-shrink-0 px-3 py-1 bg-[var(--color-gold-50)] text-[var(--color-navy)] text-xs font-medium rounded-full hover:bg-[var(--color-gold-100)] transition-colors border border-[var(--color-gold-200)]"
          >
            + {tag.label}
          </button>
        ))}
      </div>
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Textarea
            {...field}
            label="Detalles del Reclamo"
            required
            rows={5}
            placeholder="Describa los detalles del servicio médico..."
            error={fieldState.error}
            className="resize-none"
          />
        )}
      />
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---

export function NewClaim() {
  const createMutation = useCreateClaim()
  const toast = useToast()

  // --- STATE ---
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)

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

  const { handleSubmit, setError, setFocus, reset, watch, setValue, control } = form
  const clientId = watch('clientId')
  const affiliateId = watch('affiliateId')
  const patientId = watch('patientId')

  // --- DATA FETCHING ---
  const { data: clientList = [] } = useAvailableClaimClients()
  const { data: affiliateList = [], isLoading: loadingAffiliates } =
    useAvailableClaimAffiliates(clientId || undefined, true)
  const { data: patientList = [], isLoading: loadingPatients } = useAvailableClaimPatients(
    affiliateId || undefined,
    true
  )

  // --- OPTIONS MAPPING ---
  const clientOptions = clientList.map((c) => ({ value: c.id, label: c.name }))
  const affiliateOptions = affiliateList.map((a) => ({
    value: a.id,
    label: `${a.firstName} ${a.lastName}`,
  }))
  const patientOptions = patientList.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName} (${p.relationship === 'self' ? 'Titular' : 'Dep.'})`,
  }))

  // --- EFFECTS ---

  // Auto-select single client (for AFFILIATE users)
  useEffect(() => {
    if (clientList.length === 1 && !clientId) {
      setValue('clientId', clientList[0].id)
    }
  }, [clientList, clientId, setValue])

  // Auto-select single affiliate (for AFFILIATE users)
  useEffect(() => {
    if (affiliateList.length === 1 && clientId && !affiliateId) {
      setValue('affiliateId', affiliateList[0].id)
    }
  }, [affiliateList, clientId, affiliateId, setValue])

  // Cascading reset: When client changes → clear affiliate + patient
  useEffect(() => {
    setValue('affiliateId', '', { shouldValidate: false })
    setValue('patientId', '', { shouldValidate: false })
  }, [clientId, setValue])

  // Cascading reset: When affiliate changes → clear patient
  useEffect(() => {
    setValue('patientId', '', { shouldValidate: false })
  }, [affiliateId, setValue])

  // --- HANDLERS ---

  const handleFilesSelected = async (files: File[]) => {
    setUploading(true)
    try {
      const newUploads: PendingFile[] = []
      for (const file of files) {
        const { uploadUrl, storageKey } = await requestPendingUploadUrl({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          intendedEntityType: 'CLAIM',
        })

        await uploadToR2(uploadUrl, file)

        newUploads.push({
          storageKey,
          name: file.name,
          size: file.size,
          type: file.type,
          category: 'OTHER',
        })
      }
      setPendingFiles((prev) => [...prev, ...newUploads])
      toast.success(`${newUploads.length} archivo(s) subido(s)`)
    } catch (error) {
      console.error(error)
      toast.error('Error al subir archivos')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateCategory = (storageKey: string, newCategory: string) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.storageKey === storageKey ? { ...f, category: newCategory } : f))
    )
  }

  const handleRemoveFile = (storageKey: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.storageKey !== storageKey))
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        pendingFiles: pendingFiles.map((f) => ({
          storageKey: f.storageKey,
          originalName: f.name,
          fileSize: f.size,
          mimeType: f.type,
          category: f.category,
        })),
      })
      toast.success('Reclamo creado exitosamente')
      reset()
      setPendingFiles([])
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{
          path: string | string[]
          message: string
        }>
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
      toast.error('Error al crear el reclamo')
    }
  })

  // --- SUMMARY ITEMS ---
  const summaryItems = [
    {
      label: 'Cliente',
      value: clientList.find((c) => c.id === clientId)?.name || '-',
    },
    {
      label: 'Paciente',
      value: patientList.find((p) => p.id === patientId)?.firstName || '-',
    },
    {
      label: 'Archivos',
      value: pendingFiles.length,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
          title="Nuevo Reclamo"
          subtitle="Complete la información a continuación para iniciar un proceso de reembolso o autorización."
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Reclamos', to: '/reclamos' },
            { label: 'Nuevo' },
          ]}
        />

        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COLUMN: Main Inputs (8/12) */}
              <div className="lg:col-span-8 space-y-6">
                {/* SECTION 1: PARTIES */}
                <FormSection title="1. Participantes" badge="Requerido">
                  <div className="grid gap-6">
                    <Controller
                      name="clientId"
                      control={control}
                      render={({ field, fieldState }) => (
                        <SearchableSelect
                          label="Cliente (Póliza)"
                          placeholder="Seleccionar empresa..."
                          options={clientOptions}
                          value={field.value}
                          onChange={field.onChange}
                          error={fieldState.error}
                          required
                        />
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                      <div
                        className="hidden md:block absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300"
                        aria-hidden="true"
                      >
                        &rarr;
                      </div>

                      <Controller
                        name="affiliateId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className={!clientId ? 'opacity-50' : ''}>
                            <SearchableSelect
                              label="Afiliado Titular"
                              placeholder={
                                loadingAffiliates ? 'Cargando...' : 'Seleccionar titular...'
                              }
                              options={affiliateOptions}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={!clientId}
                              isLoading={loadingAffiliates}
                              error={fieldState.error}
                              required
                            />
                          </div>
                        )}
                      />

                      <Controller
                        name="patientId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className={!affiliateId ? 'opacity-50' : ''}>
                            <SearchableSelect
                              label="Paciente"
                              placeholder={
                                loadingPatients ? 'Cargando...' : 'Seleccionar paciente...'
                              }
                              options={patientOptions}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={!affiliateId}
                              isLoading={loadingPatients}
                              error={fieldState.error}
                              required
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </FormSection>

                {/* SECTION 2: DETAILS */}
                <FormSection title="2. Detalles del Caso">
                  <DescriptionField />
                </FormSection>

                {/* SECTION 3: FILES */}
                <FormSection title="3. Documentación" badge={`${pendingFiles.length} Archivos`}>
                  <div className="space-y-6">
                    <FileDropzone onFilesSelected={handleFilesSelected} loading={uploading} />

                    {uploading && (
                      <div className="text-center text-sm text-blue-600 animate-pulse">
                        Subiendo archivos...
                      </div>
                    )}

                    {pendingFiles.length > 0 && (
                      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                          Archivos Adjuntos
                        </p>
                        {pendingFiles.map((file) => (
                          <FileListItem
                            key={file.storageKey}
                            name={file.name}
                            size={file.size}
                            mimeType={file.type}
                            onRemove={() => handleRemoveFile(file.storageKey)}
                          >
                            <select
                              value={file.category || 'OTHER'}
                              onChange={(e) => handleUpdateCategory(file.storageKey, e.target.value)}
                              className="block w-full text-xs py-1.5 pl-2 pr-8 rounded-md border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                            >
                              {CLAIM_FILE_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </FileListItem>
                        ))}
                      </div>
                    )}
                  </div>
                </FormSection>
              </div>

              {/* RIGHT COLUMN: Action & Tips (4/12) */}
              <div className="lg:col-span-4 space-y-6">
                <SummaryCard
                  title="Resumen"
                  items={summaryItems}
                  sticky
                  action={
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full justify-center py-3 text-base"
                      isLoading={createMutation.isPending}
                      disabled={createMutation.isPending}
                    >
                      Crear Reclamo
                    </Button>
                  }
                  footer="Al crear el reclamo, se notificará automáticamente al equipo de soporte."
                />

                {/* Help Card */}
                <div className="bg-[var(--color-gold-50)] rounded-2xl p-6 border border-[var(--color-gold-200)]">
                  <h4 className="font-medium text-[var(--color-navy)] mb-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-[var(--color-gold-500)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Ayuda Rápida
                  </h4>
                  <ul className="text-sm text-[var(--color-navy-600)] space-y-2 pl-6 list-disc marker:text-[var(--color-gold-400)]">
                    <li>
                      Seleccione primero el <strong>Cliente</strong> para filtrar afiliados.
                    </li>
                    <li>Puede arrastrar múltiples archivos a la zona de carga.</li>
                    <li>Utilice las etiquetas rápidas para completar la descripción.</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
    </div>
  )
}

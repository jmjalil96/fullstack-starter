import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { ApiRequestError } from '../../../config/api'
import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { Input } from '../../../shared/components/ui/forms/Input'
import { SearchableSelect } from '../../../shared/components/ui/forms/SearchableSelect'
import { Textarea } from '../../../shared/components/ui/forms/Textarea'
import { useToast } from '../../../shared/hooks/useToast'
import { useCreateTicket } from '../hooks/useTicketMutations'
import { useAvailableTicketClients } from '../hooks/useTickets'
import {
  createTicketSchema,
  getCreateTicketDefaults,
  type CreateTicketFormData,
} from '../schemas/createTicketSchema'
import { TICKET_PRIORITY_CONFIG } from '../ticketLifecycle'

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

// Priority options for dropdown
const PRIORITY_OPTIONS = Object.entries(TICKET_PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

/**
 * CreateTicketModal - Form to create a new support ticket
 */
export function CreateTicketModal({ isOpen, onClose }: CreateTicketModalProps) {
  const navigate = useNavigate()
  const createMutation = useCreateTicket()
  const toast = useToast()

  // Fetch available clients for the user
  const { data: availableClients = [], isLoading: loadingClients } = useAvailableTicketClients()

  // Memoize client options for dropdown
  const clientOptions = useMemo(
    () => availableClients.map((c) => ({ value: c.id, label: c.name })),
    [availableClients]
  )

  // Determine if we should show client selector (only if more than 1 client)
  const showClientSelector = availableClients.length > 1

  const {
    control,
    handleSubmit,
    setError,
    reset,
    setValue,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    mode: 'onChange',
    defaultValues: getCreateTicketDefaults(),
  })

  // Auto-select client if user only has one
  useEffect(() => {
    if (availableClients.length === 1) {
      setValue('clientId', availableClients[0].id)
    }
  }, [availableClients, setValue])

  const handleClose = () => {
    reset(getCreateTicketDefaults())
    onClose()
  }

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const response = await createMutation.mutateAsync({
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        category: formData.category || undefined,
        clientId: formData.clientId,
      })
      toast.success('Caso creado exitosamente')
      handleClose()
      // Navigate to the new ticket detail
      navigate(`/casos/${response.id}`)
    } catch (error) {
      // Handle backend validation errors
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof CreateTicketFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al crear caso'
      toast.error(message)
    }
  })

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Caso"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-ticket-form"
            isLoading={createMutation.isPending}
            loadingText="Creando..."
          >
            Crear Caso
          </Button>
        </>
      }
    >
      <form id="create-ticket-form" onSubmit={onSubmit} className="space-y-6">
        <DetailSection title="Información del Caso">
          <DataGrid columns={2}>
            {/* Client selector - only shown if user has multiple clients */}
            {showClientSelector && (
              <Controller
                name="clientId"
                control={control}
                render={({ field, fieldState }) => (
                  <SearchableSelect
                    label="Cliente"
                    required
                    options={clientOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Seleccionar cliente..."
                    isLoading={loadingClients}
                    error={fieldState.error}
                  />
                )}
              />
            )}
            <Controller
              name="subject"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Asunto"
                  placeholder="Describe brevemente tu problema"
                  variant="light"
                  required
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field, fieldState }) => (
                <SearchableSelect
                  label="Prioridad"
                  options={PRIORITY_OPTIONS}
                  value={field.value || 'NORMAL'}
                  onChange={field.onChange}
                  error={fieldState.error}
                />
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Categoría"
                  placeholder="Ej: Facturación, Póliza, Técnico"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
          </DataGrid>
        </DetailSection>

        <DetailSection title="Descripción">
          <Controller
            name="message"
            control={control}
            render={({ field, fieldState }) => (
              <Textarea
                label="Mensaje"
                placeholder="Describe tu problema o consulta en detalle..."
                variant="light"
                rows={6}
                required
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DetailSection>
      </form>
    </Modal>
  )
}

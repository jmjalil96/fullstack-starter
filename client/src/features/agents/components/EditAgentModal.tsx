import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import {
  ConfirmationModal,
  type ChangeRecord,
} from '../../../shared/components/ui/feedback/ConfirmationModal'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { formatFieldValue } from '../../../shared/utils/formatters'
import { getAgentFormValues, mapAgentEditFormToUpdateRequest } from '../agentMappers'
import type { UpdateAgentRequest } from '../agents'
import { useUpdateAgent } from '../hooks/useAgentMutations'
import { useAgentDetail } from '../hooks/useAgents'
import { updateAgentSchema, type AgentUpdateFormData } from '../schemas/updateAgentSchema'

import { AgentForm } from './AgentForm'

interface EditAgentModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string | null
}

// Field labels for diff display
const FIELD_LABELS: Record<string, string> = {
  firstName: 'Nombre',
  lastName: 'Apellido',
  phone: 'Teléfono',
  agentCode: 'Código de Agente',
  isActive: 'Estado',
}

export function EditAgentModal({
  isOpen,
  onClose,
  agentId,
}: EditAgentModalProps) {
  const { data: agent, isLoading: isLoadingData } = useAgentDetail(agentId || '')
  const updateMutation = useUpdateAgent()
  const toast = useToast()

  const [pendingData, setPendingData] = useState<UpdateAgentRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<AgentUpdateFormData>({
    resolver: zodResolver(updateAgentSchema),
    mode: 'onChange',
    defaultValues: getAgentFormValues(agent),
  })

  const {
    handleSubmit,
    setError,
    reset,
    formState: { dirtyFields },
  } = form

  // Reset form when agent loads or modal closes
  useEffect(() => {
    if (agent && isOpen) {
      reset(getAgentFormValues(agent))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [agent, isOpen, reset])

  // Step 1: Calculate diffs and prepare payload
  const onSaveClick = handleSubmit((formData) => {
    if (!agent) return

    // Calculate diffs using formatFieldValue for consistency
    const diffs: ChangeRecord[] = Object.keys(dirtyFields)
      .filter((key) => dirtyFields[key as keyof typeof dirtyFields])
      .map((key) => {
        const fieldKey = key as keyof AgentUpdateFormData
        const oldValue: unknown = agent[fieldKey as keyof typeof agent]
        const newValue: unknown = formData[fieldKey]

        return {
          field: key,
          label: FIELD_LABELS[key] || key,
          oldValue: formatFieldValue(key, oldValue),
          newValue: formatFieldValue(key, newValue),
        }
      })
      .filter((diff) => diff.oldValue !== diff.newValue) // Only include actual changes

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    const updatePayload = mapAgentEditFormToUpdateRequest(
      formData,
      dirtyFields as Record<string, boolean | undefined>
    )

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirm save and send to API
  const handleConfirm = async () => {
    if (!agentId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: agentId,
        data: pendingData,
      })
      toast.success('Agente actualizado exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof AgentUpdateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar agente'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Agente"
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-agent-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !agent ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <AgentForm
              id="edit-agent-form"
              onSubmit={onSaveClick}
            />
          </FormProvider>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        changes={changes}
        isLoading={updateMutation.isPending}
      />
    </>
  )
}

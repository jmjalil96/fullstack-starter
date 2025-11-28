/**
 * Client Access Modal
 * Modal for managing affiliate client access (CLIENT_ADMIN role)
 * Only applicable for AFFILIATE type users
 */

import { useEffect, useMemo, useState } from 'react'

import { ApiRequestError } from '../../../../config/api'
import { Modal } from '../../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../../shared/components/ui/forms/Button'
import { MultiSelectSearchable } from '../../../../shared/components/ui/forms/MultiSelectSearchable'
import { useToast } from '../../../../shared/hooks/useToast'
import { useClients } from '../../../clients/hooks/useClients'
import { useUpdateClientAccess } from '../hooks/useUserMutations'
import type { UserListItemResponse } from '../users'

interface ClientAccessModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserListItemResponse | null
}

export function ClientAccessModal({ isOpen, onClose, user }: ClientAccessModalProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const toast = useToast()
  const updateClientAccessMutation = useUpdateClientAccess()

  // Fetch all clients
  const { data: clientsData, isLoading: isLoadingClients } = useClients({ limit: 100 })
  const clientOptions = useMemo(
    () => clientsData?.clients.map((c) => ({ value: c.id, label: c.name })) || [],
    [clientsData]
  )

  // Reset selection when user changes
  useEffect(() => {
    if (user) {
      // Note: We don't have the actual client IDs from the user object
      // The clientAccessCount tells us how many, but we'd need to fetch the actual IDs
      // For now, start with empty selection - user must reselect
      setSelectedClientIds([])
    }
  }, [user])

  const handleClose = () => {
    setSelectedClientIds([])
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const result = await updateClientAccessMutation.mutateAsync({
        id: user.id,
        data: { clientIds: selectedClientIds },
      })
      toast.success(
        selectedClientIds.length === 0
          ? 'Acceso a clientes removido'
          : `Acceso actualizado: ${result.clientAccessCount} cliente(s)`
      )
      handleClose()
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar acceso'
      toast.error(message)
    }
  }

  if (!user) return null

  // Only affiliates can have client access
  if (user.type !== 'AFFILIATE') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Acceso a Clientes" width="md">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-600">
            Solo los usuarios de tipo <strong>Afiliado</strong> pueden tener acceso a clientes.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Este usuario es de tipo:{' '}
            <strong>
              {user.type === 'EMPLOYEE' ? 'Empleado' : user.type === 'AGENT' ? 'Agente' : 'Sistema'}
            </strong>
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gestionar Acceso a Clientes"
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-access-form"
            isLoading={updateClientAccessMutation.isPending}
          >
            Guardar Cambios
          </Button>
        </>
      }
    >
      {/* User Info */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-medium">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{user.name || 'Sin nombre'}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400 mt-1">
              Acceso actual: {user.clientAccessCount} cliente(s)
            </div>
          </div>
        </div>
      </div>

      <form id="client-access-form" onSubmit={handleSubmit} className="space-y-4">
        <MultiSelectSearchable
          label="Clientes con Acceso"
          placeholder="Seleccionar clientes..."
          options={clientOptions}
          value={selectedClientIds}
          onChange={setSelectedClientIds}
          isLoading={isLoadingClients}
          emptyText="No hay clientes disponibles"
          variant="light"
        />

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Nota:</strong> El acceso a clientes permite al afiliado ver y gestionar otros
            afiliados en esos clientes (rol Admin de Cliente).
          </p>
          <p>Dejar vacío para remover todo el acceso a clientes.</p>
        </div>
      </form>
    </Modal>
  )
}

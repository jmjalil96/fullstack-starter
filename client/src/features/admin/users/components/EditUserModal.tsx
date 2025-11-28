/**
 * Edit User Modal
 * Modal for editing a user's role (SUPER_ADMIN only)
 */

import { useEffect, useMemo, useState } from 'react'

import { ApiRequestError } from '../../../../config/api'
import { Modal } from '../../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../../shared/components/ui/forms/Button'
import { SearchableSelect } from '../../../../shared/components/ui/forms/SearchableSelect'
import { useToast } from '../../../../shared/hooks/useToast'
import { useRoles } from '../hooks/useRoles'
import { useEditUser } from '../hooks/useUserMutations'
import type { UserListItemResponse, UserType } from '../users'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserListItemResponse | null
}

// Role name to display label mapping
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  CLAIMS_EMPLOYEE: 'Empleado de Reclamos',
  OPERATIONS_EMPLOYEE: 'Empleado de Operaciones',
  ADMIN_EMPLOYEE: 'Empleado Administrativo',
  AGENT: 'Agente',
  AFFILIATE: 'Afiliado',
  CLIENT_ADMIN: 'Admin de Cliente',
}

const TYPE_LABELS: Record<UserType, string> = {
  EMPLOYEE: 'Empleado',
  AGENT: 'Agente',
  AFFILIATE: 'Afiliado',
  SYSTEM: 'Sistema',
}

const TYPE_COLORS: Record<UserType, string> = {
  EMPLOYEE: 'bg-blue-100 text-blue-800',
  AGENT: 'bg-purple-100 text-purple-800',
  AFFILIATE: 'bg-green-100 text-green-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const toast = useToast()
  const editUserMutation = useEditUser()

  // Fetch roles from API
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles()

  // Create role options for dropdown
  const roleOptions = useMemo(
    () =>
      rolesData?.roles.map((r) => ({
        value: r.id,
        label: ROLE_LABELS[r.name] || r.name,
      })) || [],
    [rolesData]
  )

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setSelectedRoleId(user.globalRoleId || '')
    }
  }, [user])

  const handleClose = () => {
    setSelectedRoleId('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedRoleId) return

    try {
      await editUserMutation.mutateAsync({
        id: user.id,
        data: { globalRoleId: selectedRoleId },
      })
      toast.success('Rol actualizado exitosamente')
      handleClose()
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar el rol'
      toast.error(message)
    }
  }

  if (!user) return null

  const hasRoleChanged = selectedRoleId !== (user.globalRoleId || '')

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Usuario"
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            isLoading={editUserMutation.isPending}
            disabled={!hasRoleChanged}
          >
            Guardar Cambios
          </Button>
        </>
      }
    >
      {/* User Info */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-navy)] text-white flex items-center justify-center text-lg font-medium">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{user.name || 'Sin nombre'}</span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${TYPE_COLORS[user.type]}`}
              >
                {TYPE_LABELS[user.type]}
              </span>
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {user.globalRoleName && (
              <div className="text-xs text-gray-400 mt-1">Rol actual: {user.globalRoleName}</div>
            )}
          </div>
        </div>
      </div>

      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
        <SearchableSelect
          label="Nuevo Rol"
          placeholder="Seleccionar rol..."
          options={roleOptions}
          value={selectedRoleId}
          onChange={setSelectedRoleId}
          isLoading={isLoadingRoles}
        />

        {!hasRoleChanged && (
          <p className="text-xs text-gray-500">Seleccione un rol diferente para guardar cambios.</p>
        )}
      </form>
    </Modal>
  )
}

/**
 * Invite User Modal
 * Modal for inviting employees, agents, or affiliates
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../../config/api'
import { Modal } from '../../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../../shared/components/ui/forms/Button'
import { Input } from '../../../../shared/components/ui/forms/Input'
import { MultiSelectSearchable } from '../../../../shared/components/ui/forms/MultiSelectSearchable'
import { SearchableSelect } from '../../../../shared/components/ui/forms/SearchableSelect'
import { useToast } from '../../../../shared/hooks/useToast'
import { useClients } from '../../../clients/hooks/useClients'
import { useInviteAffiliatesBulk, useInviteAgent, useInviteEmployee } from '../hooks/useInvitationMutations'
import { useInvitableAffiliates } from '../hooks/useInvitations'
import { useRoles } from '../hooks/useRoles'
import { inviteAffiliatesBulkSchema, type InviteAffiliatesBulkFormData } from '../schemas/inviteAffiliateSchema'
import { inviteAgentSchema, type InviteAgentFormData } from '../schemas/inviteAgentSchema'
import { inviteEmployeeSchema, type InviteEmployeeFormData } from '../schemas/inviteEmployeeSchema'

type InviteType = 'EMPLOYEE' | 'AGENT' | 'AFFILIATE'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
}

// Role name filters for each invitation type
const EMPLOYEE_ROLE_NAMES = ['SUPER_ADMIN', 'CLAIMS_EMPLOYEE', 'OPERATIONS_EMPLOYEE', 'ADMIN_EMPLOYEE']
const AGENT_ROLE_NAMES = ['AGENT']
const AFFILIATE_ROLE_NAMES = ['AFFILIATE', 'CLIENT_ADMIN']

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

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [inviteType, setInviteType] = useState<InviteType>('EMPLOYEE')
  const [clientFilter, setClientFilter] = useState<string>('')
  const toast = useToast()
  const inviteEmployeeMutation = useInviteEmployee()
  const inviteAgentMutation = useInviteAgent()
  const inviteAffiliatesBulkMutation = useInviteAffiliatesBulk()

  // Fetch roles from API
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles()

  // Create filtered role options for each invitation type
  const employeeRoleOptions = useMemo(
    () =>
      rolesData?.roles
        .filter((r) => EMPLOYEE_ROLE_NAMES.includes(r.name))
        .map((r) => ({ value: r.id, label: ROLE_LABELS[r.name] || r.name })) || [],
    [rolesData]
  )

  const agentRoleOptions = useMemo(
    () =>
      rolesData?.roles
        .filter((r) => AGENT_ROLE_NAMES.includes(r.name))
        .map((r) => ({ value: r.id, label: ROLE_LABELS[r.name] || r.name })) || [],
    [rolesData]
  )

  const affiliateRoleOptions = useMemo(
    () =>
      rolesData?.roles
        .filter((r) => AFFILIATE_ROLE_NAMES.includes(r.name))
        .map((r) => ({ value: r.id, label: ROLE_LABELS[r.name] || r.name })) || [],
    [rolesData]
  )

  // Fetch clients for filter dropdown
  const { data: clientsData, isLoading: isLoadingClients } = useClients({ limit: 100 })
  const clientOptions = useMemo(
    () => clientsData?.clients.map((c) => ({ value: c.id, label: c.name })) || [],
    [clientsData]
  )

  // Fetch invitable affiliates (optionally filtered by client)
  const { data: affiliatesData, isLoading: isLoadingAffiliates } = useInvitableAffiliates({
    clientId: clientFilter || undefined,
    limit: 100,
    enabled: inviteType === 'AFFILIATE',
  })
  const affiliateOptions = useMemo(
    () =>
      affiliatesData?.affiliates.map((a) => ({
        value: a.id,
        label: `${a.firstName} ${a.lastName} - ${a.email}`,
      })) || [],
    [affiliatesData]
  )

  // Employee form
  const employeeForm = useForm<InviteEmployeeFormData>({
    resolver: zodResolver(inviteEmployeeSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      position: '',
      department: '',
      employeeCode: '',
      roleId: '',
    },
  })

  // Agent form
  const agentForm = useForm<InviteAgentFormData>({
    resolver: zodResolver(inviteAgentSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      agentCode: '',
      roleId: '',
    },
  })

  // Affiliate form (bulk)
  const affiliateForm = useForm<InviteAffiliatesBulkFormData>({
    resolver: zodResolver(inviteAffiliatesBulkSchema),
    mode: 'onChange',
    defaultValues: {
      affiliateIds: [],
      roleId: '',
    },
  })

  const handleClose = () => {
    employeeForm.reset()
    agentForm.reset()
    affiliateForm.reset()
    setInviteType('EMPLOYEE')
    setClientFilter('')
    onClose()
  }

  const onEmployeeSubmit = employeeForm.handleSubmit(async (data) => {
    try {
      // Clean empty strings to undefined
      const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
        ...(data.phone && { phone: data.phone }),
        ...(data.position && { position: data.position }),
        ...(data.department && { department: data.department }),
        ...(data.employeeCode && { employeeCode: data.employeeCode }),
      }
      await inviteEmployeeMutation.mutateAsync(payload)
      toast.success('Invitación enviada exitosamente')
      handleClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          employeeForm.setError(fieldPath as keyof InviteEmployeeFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }
      const message = error instanceof ApiRequestError ? error.message : 'Error al enviar invitación'
      toast.error(message)
    }
  })

  const onAgentSubmit = agentForm.handleSubmit(async (data) => {
    try {
      const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
        ...(data.phone && { phone: data.phone }),
        ...(data.agentCode && { agentCode: data.agentCode }),
      }
      await inviteAgentMutation.mutateAsync(payload)
      toast.success('Invitación enviada exitosamente')
      handleClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          agentForm.setError(fieldPath as keyof InviteAgentFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }
      const message = error instanceof ApiRequestError ? error.message : 'Error al enviar invitación'
      toast.error(message)
    }
  })

  const onAffiliateSubmit = affiliateForm.handleSubmit(async (data) => {
    try {
      const result = await inviteAffiliatesBulkMutation.mutateAsync({
        affiliateIds: data.affiliateIds,
        roleId: data.roleId,
      })

      if (result.failedCount > 0) {
        toast.warning(
          `${result.successCount} invitaciones enviadas, ${result.failedCount} fallaron`
        )
      } else {
        toast.success(
          result.successCount === 1
            ? 'Invitación enviada exitosamente'
            : `${result.successCount} invitaciones enviadas exitosamente`
        )
      }
      handleClose()
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : 'Error al enviar invitaciones'
      toast.error(message)
    }
  })

  const isLoading =
    inviteEmployeeMutation.isPending ||
    inviteAgentMutation.isPending ||
    inviteAffiliatesBulkMutation.isPending

  const getFormId = () => {
    switch (inviteType) {
      case 'EMPLOYEE':
        return 'invite-employee-form'
      case 'AGENT':
        return 'invite-agent-form'
      case 'AFFILIATE':
        return 'invite-affiliate-form'
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invitar Usuario"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form={getFormId()} isLoading={isLoading}>
            {inviteType === 'AFFILIATE' && affiliateForm.watch('affiliateIds').length > 1
              ? 'Enviar Invitaciones'
              : 'Enviar Invitación'}
          </Button>
        </>
      }
    >
      {/* Type Selector */}
      <fieldset className="mb-6">
        <legend className="block text-sm font-medium text-gray-700 mb-2">Tipo de Usuario</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup">
          <button
            type="button"
            onClick={() => setInviteType('EMPLOYEE')}
            className={`py-3 px-3 rounded-lg border-2 transition-colors text-center ${
              inviteType === 'EMPLOYEE'
                ? 'border-[var(--color-navy)] bg-[var(--color-navy)]/5 text-[var(--color-navy)]'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <div className="font-medium text-sm">Empleado</div>
            <div className="text-xs mt-1 opacity-70">Personal interno</div>
          </button>
          <button
            type="button"
            onClick={() => setInviteType('AGENT')}
            className={`py-3 px-3 rounded-lg border-2 transition-colors text-center ${
              inviteType === 'AGENT'
                ? 'border-[var(--color-navy)] bg-[var(--color-navy)]/5 text-[var(--color-navy)]'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <div className="font-medium text-sm">Agente</div>
            <div className="text-xs mt-1 opacity-70">Vendedor externo</div>
          </button>
          <button
            type="button"
            onClick={() => setInviteType('AFFILIATE')}
            className={`py-3 px-3 rounded-lg border-2 transition-colors text-center ${
              inviteType === 'AFFILIATE'
                ? 'border-[var(--color-navy)] bg-[var(--color-navy)]/5 text-[var(--color-navy)]'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <div className="font-medium text-sm">Afiliado</div>
            <div className="text-xs mt-1 opacity-70">Persona asegurada</div>
          </button>
        </div>
      </fieldset>

      {/* Employee Form */}
      {inviteType === 'EMPLOYEE' && (
        <FormProvider {...employeeForm}>
          <form id="invite-employee-form" onSubmit={onEmployeeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Juan"
                error={employeeForm.formState.errors.firstName}
                {...employeeForm.register('firstName')}
              />
              <Input
                label="Apellido"
                placeholder="Pérez"
                error={employeeForm.formState.errors.lastName}
                {...employeeForm.register('lastName')}
              />
            </div>

            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="juan.perez@empresa.com"
              error={employeeForm.formState.errors.email}
              {...employeeForm.register('email')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                placeholder="+51 999 888 777"
                error={employeeForm.formState.errors.phone}
                {...employeeForm.register('phone')}
              />
              <Input
                label="Código de Empleado"
                placeholder="EMP-001"
                error={employeeForm.formState.errors.employeeCode}
                {...employeeForm.register('employeeCode')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cargo"
                placeholder="Gerente de Operaciones"
                error={employeeForm.formState.errors.position}
                {...employeeForm.register('position')}
              />
              <Input
                label="Departamento"
                placeholder="Operaciones"
                error={employeeForm.formState.errors.department}
                {...employeeForm.register('department')}
              />
            </div>

            <SearchableSelect
              label="Rol"
              placeholder="Seleccionar rol..."
              options={employeeRoleOptions}
              value={employeeForm.watch('roleId')}
              onChange={(value) => employeeForm.setValue('roleId', value, { shouldValidate: true })}
              error={employeeForm.formState.errors.roleId}
              isLoading={isLoadingRoles}
            />
          </form>
        </FormProvider>
      )}

      {/* Agent Form */}
      {inviteType === 'AGENT' && (
        <FormProvider {...agentForm}>
          <form id="invite-agent-form" onSubmit={onAgentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="María"
                error={agentForm.formState.errors.firstName}
                {...agentForm.register('firstName')}
              />
              <Input
                label="Apellido"
                placeholder="García"
                error={agentForm.formState.errors.lastName}
                {...agentForm.register('lastName')}
              />
            </div>

            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="maria.garcia@agente.com"
              error={agentForm.formState.errors.email}
              {...agentForm.register('email')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                placeholder="+51 999 888 777"
                error={agentForm.formState.errors.phone}
                {...agentForm.register('phone')}
              />
              <Input
                label="Código de Agente"
                placeholder="AGT-001"
                error={agentForm.formState.errors.agentCode}
                {...agentForm.register('agentCode')}
              />
            </div>

            <SearchableSelect
              label="Rol"
              placeholder="Seleccionar rol..."
              options={agentRoleOptions}
              value={agentForm.watch('roleId')}
              onChange={(value) => agentForm.setValue('roleId', value, { shouldValidate: true })}
              error={agentForm.formState.errors.roleId}
              isLoading={isLoadingRoles}
            />
          </form>
        </FormProvider>
      )}

      {/* Affiliate Form */}
      {inviteType === 'AFFILIATE' && (
        <FormProvider {...affiliateForm}>
          <form id="invite-affiliate-form" onSubmit={onAffiliateSubmit} className="space-y-4">
            {/* Client Filter (Optional) */}
            <SearchableSelect
              label="Filtrar por Cliente (Opcional)"
              placeholder="Todos los clientes..."
              options={[{ value: '', label: 'Todos los clientes' }, ...clientOptions]}
              value={clientFilter}
              onChange={(value) => setClientFilter(value)}
              isLoading={isLoadingClients}
            />

            {/* Affiliate Multi-Select */}
            <MultiSelectSearchable
              label="Afiliados a Invitar"
              placeholder="Seleccionar afiliados..."
              options={affiliateOptions}
              value={affiliateForm.watch('affiliateIds')}
              onChange={(value) =>
                affiliateForm.setValue('affiliateIds', value, { shouldValidate: true })
              }
              isLoading={isLoadingAffiliates}
              error={
                affiliateForm.formState.errors.affiliateIds?.message
                  ? { type: 'manual', message: affiliateForm.formState.errors.affiliateIds.message }
                  : undefined
              }
              emptyText={
                affiliatesData?.affiliates.length === 0
                  ? 'No hay afiliados disponibles para invitar'
                  : 'No se encontraron resultados'
              }
              variant="light"
            />

            {/* Help text */}
            {affiliatesData && affiliatesData.affiliates.length > 0 && (
              <p className="text-xs text-gray-500">
                {affiliatesData.affiliates.length} afiliados disponibles para invitar
                {clientFilter && ' en este cliente'}
              </p>
            )}

            <SearchableSelect
              label="Rol"
              placeholder="Seleccionar rol..."
              options={affiliateRoleOptions}
              value={affiliateForm.watch('roleId')}
              onChange={(value) => affiliateForm.setValue('roleId', value, { shouldValidate: true })}
              error={affiliateForm.formState.errors.roleId}
              isLoading={isLoadingRoles}
            />
          </form>
        </FormProvider>
      )}
    </Modal>
  )
}

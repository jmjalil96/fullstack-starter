import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { DetailLayout } from '../../../shared/components/layout/templates/DetailLayout'
import {
  DataField,
  DataGrid,
  DetailSection,
} from '../../../shared/components/ui/data-display/DetailSection'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../../shared/components/ui/forms/Button'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { formatDate } from '../../../shared/utils/formatters'
import { useEmployeeDetail } from '../hooks/useEmployees'

import { EditEmployeeModal } from './EditEmployeeModal'

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { data: employee, isLoading, isError, error } = useEmployeeDetail(id || '')

  // Guard: no ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Empleados', to: '/admin/empleados' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de empleado no encontrado</p>
            <Button onClick={() => navigate('/admin/empleados')} className="mt-4">
              Volver a la Lista
            </Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Error state
  if (isError) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error al Cargar Empleado"
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Empleados', to: '/admin/empleados' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar empleado</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Empleado no encontrado'}
            </p>
            <Button onClick={() => navigate('/admin/empleados')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (isLoading || !employee) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Empleados', to: '/admin/empleados' },
              { label: 'Cargando...' },
            ]}
          />
        }
        sidebar={<div className="animate-pulse bg-gray-200/50 h-32 rounded-xl" />}
      >
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-gray-200/50 rounded-xl" />
          <div className="h-64 bg-gray-200/50 rounded-xl" />
          <div className="h-32 bg-gray-200/50 rounded-xl" />
        </div>
      </DetailLayout>
    )
  }

  const fullName = `${employee.firstName} ${employee.lastName}`

  return (
    <DetailLayout
      header={
        <PageHeader
          title={fullName}
          subtitle={employee.employeeCode ? `Código: ${employee.employeeCode}` : `ID: ${employee.id}`}
          breadcrumbs={[
            { label: 'Admin', to: '/admin' },
            { label: 'Empleados', to: '/admin/empleados' },
            { label: fullName },
          ]}
          action={
            <Button onClick={() => setEditModalOpen(true)}>
              Editar Empleado
            </Button>
          }
        />
      }
      sidebar={<div />}
    >
      {/* Personal Information */}
      <DetailSection title="Información Personal">
        <DataGrid columns={3}>
          <DataField label="Nombre" value={employee.firstName} />
          <DataField label="Apellido" value={employee.lastName} />
          <DataField label="Email" value={employee.email} />
          <DataField label="Teléfono" value={employee.phone || null} />
          <DataField
            label="Estado"
            value={
              <StatusBadge
                label={employee.isActive ? 'Activo' : 'Inactivo'}
                color={employee.isActive ? 'green' : 'gray'}
              />
            }
          />
        </DataGrid>
      </DetailSection>

      {/* Work Information */}
      <DetailSection title="Información Laboral">
        <DataGrid columns={3}>
          <DataField label="Cargo" value={employee.position || null} />
          <DataField label="Departamento" value={employee.department || null} />
          <DataField label="Código de Empleado" value={employee.employeeCode || null} />
        </DataGrid>
      </DetailSection>

      {/* User Account */}
      <DetailSection title="Cuenta de Usuario">
        <DataGrid columns={2}>
          <DataField
            label="Tiene Cuenta"
            value={
              <StatusBadge
                label={employee.hasUserAccount ? 'Sí' : 'No'}
                color={employee.hasUserAccount ? 'green' : 'gray'}
              />
            }
          />
          <DataField label="ID de Usuario" value={employee.userId || null} />
        </DataGrid>
      </DetailSection>

      {/* System Information */}
      <DetailSection title="Información del Sistema">
        <DataGrid columns={2}>
          <DataField
            label="Fecha de Creación"
            value={formatDate(employee.createdAt)}
          />
          <DataField
            label="Última Actualización"
            value={employee.updatedAt ? formatDate(employee.updatedAt) : null}
          />
        </DataGrid>
      </DetailSection>

      {/* Edit Modal */}
      <EditEmployeeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        employeeId={employee.id}
      />
    </DetailLayout>
  )
}

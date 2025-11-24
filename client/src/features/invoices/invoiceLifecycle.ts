/**
 * Invoice Lifecycle Rules (Frontend)
 *
 * ⚠️ CRITICAL: MANUAL COPY FROM BACKEND BLUEPRINT ⚠️
 *
 * SOURCE FILE: api/src/features/invoices/shared/invoiceLifecycle.blueprint.ts
 */

import type { InvoiceStatus } from './invoices'

export type TransitionVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'

export interface Transition {
  status: InvoiceStatus
  label: string
  buttonLabel: string
  variant: TransitionVariant
  icon: string
}

export interface LifecycleState {
  label: string
  color: 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple' | 'orange'
  editableFields: readonly string[]
  transitions: Transition[]
  requirements: readonly string[]
}

export const INVOICE_LIFECYCLE: Record<InvoiceStatus, LifecycleState> = {
  PENDING: {
    label: 'Pendiente',
    color: 'blue',
    editableFields: [
      'invoiceNumber',
      'insurerInvoiceNumber',
      'clientId',
      'insurerId',
      'billingPeriod',
      'totalAmount',
      'taxAmount',
      'actualAffiliateCount',
      'expectedAmount',
      'expectedAffiliateCount',
      'issueDate',
      'dueDate',
      'discrepancyNotes',
    ],
    transitions: [
      {
        status: 'VALIDATED',
        label: 'Validar',
        buttonLabel: 'Validar Factura',
        variant: 'success',
        icon: '✓',
      },
      {
        status: 'DISCREPANCY',
        label: 'Marcar Discrepancia',
        buttonLabel: 'Marcar Discrepancia',
        variant: 'secondary',
        icon: '⚠',
      },
      {
        status: 'CANCELLED',
        label: 'Cancelar',
        buttonLabel: 'Cancelar Factura',
        variant: 'danger',
        icon: '✗',
      },
    ],
    requirements: ['billingPeriod', 'taxAmount', 'actualAffiliateCount', 'dueDate'],
  },

  VALIDATED: {
    label: 'Validada',
    color: 'green',
    editableFields: ['paymentStatus', 'paymentDate', 'discrepancyNotes'],
    transitions: [
      {
        status: 'DISCREPANCY',
        label: 'Marcar Discrepancia',
        buttonLabel: 'Marcar Discrepancia',
        variant: 'secondary',
        icon: '⚠',
      },
      {
        status: 'CANCELLED',
        label: 'Cancelar',
        buttonLabel: 'Cancelar Factura',
        variant: 'danger',
        icon: '✗',
      },
    ],
    requirements: [],
  },

  DISCREPANCY: {
    label: 'Discrepancia',
    color: 'yellow',
    editableFields: [
      'discrepancyNotes',
      'expectedAmount',
      'actualAffiliateCount',
      'totalAmount',
      'taxAmount',
      'billingPeriod',
      'paymentStatus',
      'paymentDate',
    ],
    transitions: [
      {
        status: 'VALIDATED',
        label: 'Validar',
        buttonLabel: 'Validar Factura',
        variant: 'success',
        icon: '✓',
      },
      {
        status: 'CANCELLED',
        label: 'Cancelar',
        buttonLabel: 'Cancelar Factura',
        variant: 'danger',
        icon: '✗',
      },
    ],
    requirements: ['discrepancyNotes'],
  },

  CANCELLED: {
    label: 'Cancelada',
    color: 'red',
    editableFields: ['discrepancyNotes'],
    transitions: [],
    requirements: [],
  },
}

export const FIELD_LABELS: Record<string, string> = {
  invoiceNumber: 'Número de Factura',
  insurerInvoiceNumber: 'Número Aseguradora',
  clientId: 'Cliente',
  insurerId: 'Aseguradora',
  billingPeriod: 'Período de Facturación',
  totalAmount: 'Monto Total',
  taxAmount: 'Impuesto',
  actualAffiliateCount: 'Conteo Real de Afiliados',
  expectedAmount: 'Monto Esperado',
  expectedAffiliateCount: 'Conteo Esperado de Afiliados',
  issueDate: 'Fecha de Emisión',
  dueDate: 'Fecha de Vencimiento',
  paymentDate: 'Fecha de Pago',
  paymentStatus: 'Estado de Pago',
  discrepancyNotes: 'Notas de Discrepancia',
}

/**
 * Check if a field value is present (not null/undefined)
 */
export function isFieldPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

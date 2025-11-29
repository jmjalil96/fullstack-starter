/**
 * ClaimCard - Reusable claim card component
 *
 * Used by both ClaimsKanban (kanban columns) and ClaimsMobileList (mobile view).
 * Displays claim summary with patient, affiliate, client, and amount info.
 */

import { useNavigate } from 'react-router-dom'

import { KanbanCard } from '../../../shared/components/ui'
import type { ClaimListItemResponse } from '../claims'

// ============================================================================
// ICONS (Using simple SVGs to avoid deps)
// ============================================================================

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

export function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

// ============================================================================
// CLAIM CARD COMPONENT
// ============================================================================

interface ClaimCardProps {
  claim: ClaimListItemResponse
}

export function ClaimCard({ claim }: ClaimCardProps) {
  const navigate = useNavigate()

  const formattedAmount = claim.amountSubmitted !== null
    ? new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(claim.amountSubmitted)
    : null

  const formattedDate = claim.submittedDate
    ? new Date(claim.submittedDate).toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'short',
      })
    : null

  // Status color for left border (aligned with column headers)
  const statusBorderColor: Record<string, string> = {
    DRAFT: '#6b7280',         // gray-500
    VALIDATION: '#f59e0b',    // amber-500
    SUBMITTED: '#336f8f',     // navy-400
    PENDING_INFO: '#f97316',  // orange-500
    RETURNED: '#dc2626',      // red-600
    SETTLED: '#008c7e',       // teal
    CANCELLED: '#6b7280',     // gray-500
  }
  const borderColor = statusBorderColor[claim.status] || '#6b7280'

  return (
    <KanbanCard
      onClick={() => navigate(`/reclamos/${claim.id}`)}
      className="relative overflow-hidden pl-4 border-l-4"
      style={{ borderLeftColor: borderColor }}
    >
      {/* Header: ID & Amount */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
          {claim.claimNumber}
        </span>
        {formattedAmount ? (
          <span className="text-sm font-bold text-slate-800">
            {formattedAmount}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin monto</span>
        )}
      </div>

      {/* Main Info */}
      <div className="space-y-2 mb-3">
        {/* Patient */}
        <div className="flex items-start gap-2 group">
          <div className="mt-0.5 shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {claim.patientFirstName} {claim.patientLastName}
            </p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Paciente</p>
          </div>
        </div>

        {/* Affiliate */}
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-gray-300">
            <BuildingIcon className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-gray-600 truncate">
            {claim.affiliateFirstName} {claim.affiliateLastName}
          </p>
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-3" />

      {/* Footer: Client & Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 max-w-[60%]">
          <BriefcaseIcon className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="text-[11px] font-medium text-gray-500 truncate">
            {claim.clientName}
          </span>
        </div>

        {formattedDate && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[11px] font-medium">
              {formattedDate}
            </span>
          </div>
        )}
      </div>
    </KanbanCard>
  )
}

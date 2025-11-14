/**
 * Barrel export for policy detail components
 * Centralizes all detail view components and types
 */

// Core display components
export { WorkflowStepper } from './WorkflowStepper'
export { PolicyHeader } from './PolicyHeader'
export { PolicyDetailsCard } from './PolicyDetailsCard'
export { PolicyActionsCard } from './PolicyActionsCard'
export { PolicyMetadataCard } from './PolicyMetadataCard'
export { PolicyDetailSkeleton } from './PolicyDetailSkeleton'

// Modal components
export { EditConfirmationModal } from './EditConfirmationModal'
export { StatusTransitionModal } from './StatusTransitionModal'
export { EditPolicyModal } from './EditPolicyModal'

// Types
export type { FieldChange } from './EditConfirmationModal'

/**
 * React Query mutation hooks for tickets
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  AddTicketMessageRequest,
  AssignTicketRequest,
  CreateTicketRequest,
  TicketUpdateRequest,
} from '../tickets'
import { addTicketMessage, assignTicket, createTicket, updateTicket } from '../ticketsApi'

import { TICKETS_KEYS } from './useTickets'

/**
 * Create a new ticket
 *
 * @example
 * const { mutate, isPending } = useCreateTicket()
 * mutate({ subject: 'Help', message: 'I need help' })
 */
export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.lists() })
    },
  })
}

/**
 * Update a ticket (status, priority, category)
 *
 * @example
 * const { mutate } = useUpdateTicket()
 * mutate({ id: 'ticket-123', data: { status: 'IN_PROGRESS' } })
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketUpdateRequest }) =>
      updateTicket(id, data),
    onSuccess: (updatedTicket, variables) => {
      queryClient.setQueryData(TICKETS_KEYS.detail(variables.id), (old: unknown) => {
        if (!old) return old
        return { ...old, ...updatedTicket }
      })
      queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.lists() })
    },
  })
}

/**
 * Assign a ticket to an employee
 *
 * @example
 * const { mutate } = useAssignTicket()
 * mutate({ id: 'ticket-123', data: { assignedToId: 'user-456' } })
 */
export function useAssignTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTicketRequest }) =>
      assignTicket(id, data),
    onSuccess: (updatedTicket, variables) => {
      queryClient.setQueryData(TICKETS_KEYS.detail(variables.id), (old: unknown) => {
        if (!old) return old
        return { ...old, ...updatedTicket }
      })
      queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.lists() })
    },
  })
}

/**
 * Add a message to a ticket
 *
 * @example
 * const { mutate } = useAddTicketMessage()
 * mutate({ ticketId: 'ticket-123', data: { message: 'Thanks for the update' } })
 */
export function useAddTicketMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: AddTicketMessageRequest }) =>
      addTicketMessage(ticketId, data),
    onSuccess: (_newMessage, variables) => {
      // Invalidate detail to refetch with new message
      queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.detail(variables.ticketId) })
      // Invalidate lists to update message count
      queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.lists() })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import { meQueryKey } from '../app/auth.tsx'

export function useAuthMutations() {
  return {
    requestOtp: useMutation({ mutationFn: (email: string) => unwrap(api.POST('/auth/otp/request', { body: { email } })) }),
    verifyOtp: useMutation({
      mutationFn: (body: { email: string; code: string; staffCode?: string }) => unwrap(api.POST('/auth/otp/verify', { body })),
    }),
  }
}

export function useProfileMutations() {
  const qc = useQueryClient()
  const setMe = (user: Schemas['User']) => qc.setQueryData(meQueryKey, user)
  return {
    update: useMutation({ mutationFn: (body: Schemas['UserUpdate']) => unwrap(api.PATCH('/me', { body })), onSuccess: setMe }),
    requestEmailChange: useMutation({
      mutationFn: (newEmail: string) => unwrap(api.POST('/me/email-change', { body: { newEmail } })),
    }),
    verifyEmailChange: useMutation({
      mutationFn: (code: string) => unwrap(api.POST('/me/email-change/verify', { body: { code } })),
      onSuccess: setMe,
    }),
    requestDeletion: useMutation({ mutationFn: () => unwrap(api.POST('/me/deletion-request')) }),
  }
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => unwrap(api.GET('/notifications', { params: { query: { page: 0, size: 20 } } })),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      unwrap(api.POST('/notifications/{notificationId}/read', { params: { path: { notificationId } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMyTickets() {
  return useQuery({ queryKey: ['support-tickets'], queryFn: () => unwrap(api.GET('/support-tickets')) })
}

export function useMyTicket(ticketId: string) {
  return useQuery({
    queryKey: ['support-tickets', ticketId],
    queryFn: () => unwrap(api.GET('/support-tickets/{ticketId}', { params: { path: { ticketId } } })),
  })
}

export function useTicketMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (body: Schemas['SupportTicketCreate']) => unwrap(api.POST('/support-tickets', { body })),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['support-tickets'] }),
    }),
    reply: useMutation({
      mutationFn: ({ ticketId, body }: { ticketId: string; body: string }) =>
        unwrap(api.POST('/support-tickets/{ticketId}/messages', { params: { path: { ticketId } }, body: { body } })),
      onSuccess: (_m, v) => qc.invalidateQueries({ queryKey: ['support-tickets', v.ticketId] }),
    }),
  }
}

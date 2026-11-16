import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, session, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import { track } from '../lib/analytics.ts'

export function useMyChoiceSessions(enabled = true) {
  return useQuery({ queryKey: ['choice-sessions'], queryFn: () => unwrap(api.GET('/choice-sessions')), enabled })
}

export function useChoiceSession(sessionId: string) {
  return useQuery({
    queryKey: ['choice-sessions', sessionId],
    queryFn: () => unwrap(api.GET('/choice-sessions/{sessionId}', { params: { path: { sessionId } } })),
    refetchOnWindowFocus: true, // thấy phiếu/ trạng thái mới của người kia khi quay lại tab
  })
}

export function useCreateChoiceSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ placeIds, idempotencyKey }: { placeIds: string[]; idempotencyKey: string }) =>
      unwrap(api.POST('/choice-sessions', { params: { header: { 'Idempotency-Key': idempotencyKey } }, body: { placeIds } })),
    onSuccess: (s) => {
      track('invite_created', { objectId: s.id })
      return qc.invalidateQueries({ queryKey: ['choice-sessions'] })
    },
  })
}

export function useCastVote(sessionId: string) {
  const qc = useQueryClient()
  const key = ['choice-sessions', sessionId]
  return useMutation({
    mutationFn: ({ candidateId, preference }: { candidateId: string; preference: Schemas['VotePreference'] }) =>
      unwrap(
        api.PUT('/choice-sessions/{sessionId}/votes/{candidateId}', {
          params: { path: { sessionId, candidateId } },
          body: { preference },
        }),
      ),
    // Cập nhật lạc quan; lỗi thì hoàn tác (UX-04)
    onMutate: async ({ candidateId, preference }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Schemas['ChoiceSession']>(key)
      if (previous)
        qc.setQueryData<Schemas['ChoiceSession']>(key, {
          ...previous,
          candidates: previous.candidates.map((c) => (c.id === candidateId ? { ...c, myVote: preference } : c)),
        })
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSuccess: (_d, v) => track('vote_submitted', { objectId: sessionId, properties: { candidateId: v.candidateId, preference: v.preference } }),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useFinalizeChoice(sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: { candidateId: string; scheduledAt: string; note?: string; idempotencyKey: string }) =>
      unwrap(
        api.POST('/choice-sessions/{sessionId}/finalize', {
          params: { path: { sessionId }, header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ),
    onSuccess: (plan) => {
      track('date_plan_created', { objectId: plan.id })
      qc.invalidateQueries({ queryKey: ['choice-sessions'] })
      return qc.invalidateQueries({ queryKey: ['date-plans'] })
    },
  })
}

export function useSharingMutations(sessionId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['choice-sessions', sessionId] })
  return {
    newGrant: useMutation({
      mutationFn: () => unwrap(api.POST('/choice-sessions/{sessionId}/share-grants', { params: { path: { sessionId } } })),
      onSuccess: invalidate,
    }),
    revoke: useMutation({
      mutationFn: (grantId: string) =>
        unwrap(api.DELETE('/choice-sessions/{sessionId}/share-grants/{grantId}', { params: { path: { sessionId, grantId } } })),
      onSuccess: invalidate,
    }),
    removeRecipient: useMutation({
      mutationFn: () => unwrap(api.DELETE('/choice-sessions/{sessionId}/recipient', { params: { path: { sessionId } } })),
      onSuccess: invalidate,
    }),
  }
}

export function useInvitePreview(inviteToken: string) {
  return useQuery({
    queryKey: ['share-grants', inviteToken],
    queryFn: () => unwrap(api.GET('/share-grants/{inviteToken}', { params: { path: { inviteToken } } })),
    retry: false,
  })
}

/** Tham gia bằng tên hiển thị → phiên khách theo link, không phải đăng nhập (CR-001, RULE-30). */
export function useJoinInvite(inviteToken: string) {
  return useMutation({
    mutationFn: (displayName: string) =>
      unwrap(api.POST('/share-grants/{inviteToken}/join', { params: { path: { inviteToken } }, body: { displayName } })),
    onSuccess: (r) => session.setRecipientSession(r.recipientSession),
  })
}

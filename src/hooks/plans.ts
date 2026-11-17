import { useMemo, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import { track } from '../lib/analytics.ts'
import { readJson, readStorage, writeJson } from '../lib/storage.ts'

export function useDatePlans(enabled = true) {
  return useQuery({ queryKey: ['date-plans'], queryFn: () => unwrap(api.GET('/date-plans')), enabled })
}

export function useDatePlan(planId: string) {
  return useQuery({
    queryKey: ['date-plans', planId],
    queryFn: () => unwrap(api.GET('/date-plans/{planId}', { params: { path: { planId } } })),
  })
}

export function useCreateDatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: Schemas['DatePlanWrite'] & { idempotencyKey: string }) =>
      unwrap(api.POST('/date-plans', { params: { header: { 'Idempotency-Key': idempotencyKey } }, body })),
    onSuccess: (plan) => {
      track('date_plan_created', { objectId: plan.id })
      return qc.invalidateQueries({ queryKey: ['date-plans'] })
    },
  })
}

export function usePlanMutations(planId: string) {
  const qc = useQueryClient()
  const onSuccess = (plan: Schemas['DatePlan']) => {
    qc.setQueryData(['date-plans', planId], plan)
    return qc.invalidateQueries({ queryKey: ['date-plans'] })
  }
  return {
    update: useMutation({
      mutationFn: (body: Schemas['DatePlanUpdate']) =>
        unwrap(api.PATCH('/date-plans/{planId}', { params: { path: { planId } }, body })),
      onSuccess,
    }),
    cancel: useMutation({
      mutationFn: () => unwrap(api.POST('/date-plans/{planId}/cancel', { params: { path: { planId } } })),
      onSuccess,
    }),
  }
}

/* ───────────── Lời nhắc "Đi chưa?" (FR-18, CR-001) ─────────────
 * Contract chưa có resource lời nhắc / dismiss (CCR-02). Tạm thời:
 *  - Điều kiện hiện: kế hoạch chưa hủy, đã đến scheduledAt, chưa trả lời, viewer là chủ (OQ-10 mặc định).
 *  - "Đã đi" gọi PUT /visit-report {answer: YES} (có trong contract).
 *  - "Bỏ qua lời nhắc" chỉ lưu trên thiết bị này.
 *    shortcut: CCR-02 — chuyển sang API dismiss khi backend thêm; khi đó lời nhắc nhớ trạng thái trên mọi thiết bị.
 * Không bao giờ gửi answer NO khi bỏ qua (RULE-15).
 */
const DISMISSED_KEY = 'gwb.dismissedReminders'
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => (listeners.add(fn), () => listeners.delete(fn))
const snapshot = () => readStorage(DISMISSED_KEY) ?? '[]'

/** Danh sách lời nhắc đã bỏ qua (phản ứng ngay khi bỏ qua, ở mọi màn đang mở). */
export function useDismissedReminders(): string[] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]')
  return useMemo(() => {
    try {
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  }, [raw])
}

export function isReminderDue(plan: Schemas['DatePlan'], now: number, dismissed: readonly string[] = []) {
  return (
    plan.viewerRole === 'OWNER' &&
    plan.status !== 'CANCELLED' &&
    plan.visitAnswer == null &&
    new Date(plan.scheduledAt).getTime() <= now &&
    !dismissed.includes(plan.id)
  )
}

export function useVisitReminder(planId: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['date-plans'] })
  return {
    confirmVisited: useMutation({
      mutationFn: () => unwrap(api.PUT('/date-plans/{planId}/visit-report', { params: { path: { planId } }, body: { answer: 'YES' } })),
      onSuccess: () => {
        track('visit_self_reported', { objectId: planId, properties: { answer: 'YES' } })
        return refresh()
      },
    }),
    dismiss: () => {
      const ids = readJson<string[]>(DISMISSED_KEY, [])
      if (!ids.includes(planId)) writeJson(DISMISSED_KEY, [...ids, planId])
      listeners.forEach((fn) => fn())
    },
  }
}

/** Tải tệp .ics qua client (có header xác thực / phiên người nhận), rồi lưu thành tệp. */
export async function downloadCalendar(planId: string) {
  const blob = await unwrap(
    api.GET('/date-plans/{planId}/calendar.ics', { params: { path: { planId } }, parseAs: 'blob' }),
  )
  const url = URL.createObjectURL(blob as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `buoi-hen-${planId.slice(-6)}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

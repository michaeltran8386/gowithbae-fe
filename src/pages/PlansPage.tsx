import { Link, useSearchParams } from 'react-router'
import { ChevronRight, Users } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { isReminderDue, useDatePlans, useDismissedReminders } from '../hooks/plans.ts'
import { useMyChoiceSessions } from '../hooks/choice.ts'
import { useNow } from '../hooks/useNow.ts'
import { PlanCard } from '../components/plan/PlanCard.tsx'
import { VisitReminderTicket } from '../components/plan/VisitReminder.tsx'
import { ButtonLink } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'

const TABS = [
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'past', label: 'Đã qua' },
  { key: 'cancelled', label: 'Đã hủy' },
] as const
type Tab = (typeof TABS)[number]['key']

function inTab(plan: Schemas['DatePlan'], tab: Tab, now: number) {
  if (tab === 'cancelled') return plan.status === 'CANCELLED'
  if (plan.status === 'CANCELLED') return false
  const future = new Date(plan.scheduledAt).getTime() > now
  return tab === 'upcoming' ? plan.status === 'SCHEDULED' && future : plan.status === 'PAST' || !future
}

/** S-13 Buổi hẹn — FR-15/16; phiên đang cùng chọn (UX-01); lời nhắc FR-18. */
export function PlansPage() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.key === params.get('tab'))?.key ?? 'upcoming') as Tab
  const plans = useDatePlans()
  const sessions = useMyChoiceSessions()
  const now = useNow()
  const dismissed = useDismissedReminders()
  const due = (plans.data ?? []).filter((p) => isReminderDue(p, now, dismissed))
  const list = (plans.data ?? [])
    .filter((p) => inTab(p, tab, now))
    .sort((a, b) => (tab === 'upcoming' ? a.scheduledAt.localeCompare(b.scheduledAt) : b.scheduledAt.localeCompare(a.scheduledAt)))
  const openSessions = (sessions.data ?? []).filter((s) => s.status !== 'FINALIZED')

  return (
    <>
      <h1 className="text-2xl font-bold md:text-3xl">Buổi hẹn</h1>

      {due.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {due.map((p) => (
            <VisitReminderTicket key={p.id} plan={p} />
          ))}
        </div>
      )}

      {openSessions.length > 0 && (
        <section aria-labelledby="sessions-heading" className="mt-6">
          <h2 id="sessions-heading" className="mb-3 text-[17px] font-semibold">
            Đang cùng chọn
          </h2>
          <ul className="flex flex-col gap-2">
            {openSessions.map((s) => (
              <li key={s.id}>
                <Link to={`/choice/${s.id}`} className="flex min-h-16 items-center gap-3 rounded-block border border-line bg-white px-4 py-3 hover:border-action">
                  <Users size={20} className="text-action" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{s.recipientName ? `Cùng chọn với ${s.recipientName}` : 'Chờ người ấy tham gia'}</span>
                    <span className="text-[13px] text-ink-muted tabular">{s.candidates.length} lựa chọn</span>
                  </span>
                  <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div role="tablist" aria-label="Lọc buổi hẹn" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setParams(t.key === 'upcoming' ? {} : { tab: t.key }, { replace: true })}
            className={`-mb-px min-h-11 border-b-2 px-4 text-sm whitespace-nowrap ${tab === t.key ? 'border-action font-semibold text-action' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4">
        {plans.isPending ? (
          <Skeleton className="h-40" />
        ) : plans.isError ? (
          <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === 'upcoming' ? 'Chưa có buổi hẹn sắp tới' : tab === 'past' ? 'Chưa có buổi hẹn đã qua' : 'Không có buổi hẹn đã hủy'}
            action={tab === 'upcoming' ? <ButtonLink to="/">Khám phá địa điểm</ButtonLink> : undefined}
          >
            {tab === 'upcoming' && 'Chọn một nơi rồi bấm “Lên kế hoạch” để tạo buổi hẹn.'}
          </EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((p) => (
              <li key={p.id}>
                <PlanCard plan={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

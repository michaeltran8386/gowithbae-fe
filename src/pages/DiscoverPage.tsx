import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CalendarClock, ChevronRight, MapPin, Search, Users } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { useAuth } from '../app/auth.tsx'
import { useAreas, useCollections, useTaxonomies } from '../hooks/places.ts'
import { useMyChoiceSessions } from '../hooks/choice.ts'
import { isReminderDue, useDatePlans, useDismissedReminders } from '../hooks/plans.ts'
import { formatDateTime } from '../lib/format.ts'
import { useNow } from '../hooks/useNow.ts'
import { BUDGETS } from '../lib/budgets.ts'
import { VisitReminderTicket } from '../components/plan/VisitReminder.tsx'
import { PrimaryButton } from '../components/ui/Button.tsx'
import { ErrorState, Skeleton } from '../components/ui/StateView.tsx'

/** S-01 Khám phá — FR-01; khu "Tiếp tục" (hướng B+) gồm lời nhắc FR-18, phiên cùng chọn, buổi hẹn sắp tới. */
export function DiscoverPage() {
  const { state } = useAuth()
  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Khám phá nơi hẹn hò</h1>
      {state.status === 'member' && <ContinueSection />}
      <SearchHero />
      <Collections />
    </div>
  )
}

function ContinueSection() {
  const plans = useDatePlans()
  const sessions = useMyChoiceSessions()
  const now = useNow()
  const dismissed = useDismissedReminders()
  const due = (plans.data ?? []).filter((p) => isReminderDue(p, now, dismissed))
  const upcoming = (plans.data ?? [])
    .filter((p) => p.status === 'SCHEDULED' && new Date(p.scheduledAt).getTime() > now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]
  const openSession = (sessions.data ?? []).find((s) => s.status !== 'FINALIZED')

  if (plans.isPending || sessions.isPending)
    return (
      <div className="grid gap-3 md:grid-cols-3" aria-hidden="true">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    )
  if (!due.length && !upcoming && !openSession) return null

  return (
    <section aria-labelledby="continue-heading">
      <h2 id="continue-heading" className="mb-3 text-[17px] font-semibold">
        Tiếp tục
      </h2>
      <div className="grid items-start gap-3 md:grid-cols-3">
        {due.map((p) => (
          <VisitReminderTicket key={p.id} plan={p} />
        ))}
        {openSession && <SessionCard session={openSession} />}
        {upcoming && (
          <Link to={`/plans/${upcoming.id}`} className="flex flex-col gap-2 rounded-block border border-line bg-white p-4 hover:border-action">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-action">
              <CalendarClock size={18} aria-hidden="true" /> Buổi hẹn sắp tới
            </span>
            <span className="font-semibold">{upcoming.place.name}</span>
            <span className="text-sm text-ink-muted tabular">{formatDateTime(upcoming.scheduledAt)}</span>
          </Link>
        )}
      </div>
    </section>
  )
}

function SessionCard({ session }: { session: Schemas['ChoiceSession'] }) {
  const answered = session.candidates.filter((c) => c.myVote).length
  const total = session.candidates.length
  return (
    <Link to={`/choice/${session.id}`} className="flex flex-col gap-2 rounded-block border border-line bg-white p-4 hover:border-action">
      <span className="flex items-center gap-2 text-[13px] font-semibold text-action">
        <Users size={18} aria-hidden="true" /> Đang cùng chọn
      </span>
      <span className="font-semibold">{session.recipientName ? `Cùng chọn với ${session.recipientName}` : 'Chờ người ấy tham gia'}</span>
      <span className="text-sm text-ink-muted tabular">
        Bạn đã trả lời {answered}/{total} nơi
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-action-soft" aria-hidden="true">
        <span className="block h-full bg-action" style={{ width: `${(answered / total) * 100}%` }} />
      </span>
    </Link>
  )
}

function SearchHero() {
  const navigate = useNavigate()
  const areas = useAreas()
  const taxonomies = useTaxonomies()
  const [q, setQ] = useState('')
  const [areaId, setAreaId] = useState('')
  const [budget, setBudget] = useState('')
  const activities = (taxonomies.data ?? []).filter((t) => t.group === 'ACTIVITY' && t.status === 'ACTIVE')

  return (
    <section aria-labelledby="search-heading">
      <h2 id="search-heading" className="text-2xl leading-8 font-bold md:text-3xl md:leading-9">
        Tìm nơi hẹn hò
      </h2>
      <p className="mt-1 text-ink-muted">Lọc theo khu vực, ngân sách cho hai người và việc hai bạn muốn làm.</p>
      <form
        role="search"
        className="mt-5 grid gap-2 rounded-block border border-line bg-white p-2 md:grid-cols-[1.4fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams()
          if (q.trim()) params.set('q', q.trim())
          if (areaId) params.set('areaId', areaId)
          if (budget) params.set('budget', budget)
          navigate(`/search?${params}`)
        }}
      >
        <label className="relative">
          <span className="sr-only">Từ khóa</span>
          <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={100}
            placeholder="Tên quán, khu vực, hoạt động…"
            className="min-h-12 w-full rounded-control bg-page pr-3 pl-10 placeholder:text-ink-muted/80 focus:bg-white"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Khu vực</span>
          <MapPin size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="min-h-12 w-full rounded-control bg-page pr-3 pl-10">
            <option value="">Mọi khu vực</option>
            {areas.data?.filter((a) => a.status === 'ACTIVE').map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Ngân sách cho hai người</span>
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className="min-h-12 w-full rounded-control bg-page px-3">
            <option value="">Mọi ngân sách (2 người)</option>
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <PrimaryButton type="submit" className="min-h-12 px-6">
          Tìm
        </PrimaryButton>
      </form>

      {activities.length > 0 && (
        <nav aria-label="Tìm theo hoạt động" className="-mx-4 mt-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2 md:flex-wrap">
            {activities.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/search?tagIds=${a.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm whitespace-nowrap text-ink-muted hover:border-action hover:text-action"
                >
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  )
}

function Collections() {
  const collections = useCollections()
  if (collections.isError) return <ErrorState error={collections.error} onRetry={() => collections.refetch()} />
  if (collections.isPending)
    return (
      <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )
  if (collections.data.length === 0) return null // không có bộ sưu tập đang hiển thị: giữ tìm kiếm

  return (
    <section aria-labelledby="collections-heading">
      <h2 id="collections-heading" className="mb-3 text-xl font-bold">
        Bộ sưu tập
      </h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:px-0">
        {collections.data.map((c) => (
          <li key={c.id} className="w-[78%] shrink-0 snap-start md:w-auto">
            <Link
              to={`/collections/${c.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-block border border-line bg-white hover:border-action"
            >
              <div className="aspect-[16/9] bg-[linear-gradient(160deg,var(--color-sky-100),var(--color-action-soft)_55%,var(--color-peach-50))]">
                {c.coverUrl && <img src={c.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <span className="flex items-center justify-between gap-2 p-4 font-semibold group-hover:text-action">
                {c.title}
                <ChevronRight size={18} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

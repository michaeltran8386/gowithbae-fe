import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { CalendarClock, DollarSign, Filter, MapPin, Users } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { useAuth } from '../app/auth.tsx'
import { useAreas, useCollections, useTaxonomies } from '../hooks/places.ts'
import { useSiteContent } from '../hooks/adminSupport.ts'
import { useMyChoiceSessions } from '../hooks/choice.ts'
import { isReminderDue, useDatePlans, useDismissedReminders } from '../hooks/plans.ts'
import { formatDateTime } from '../lib/format.ts'
import { useNow } from '../hooks/useNow.ts'
import { BUDGETS } from '../lib/budgets.ts'
import { VisitReminderTicket } from '../components/plan/VisitReminder.tsx'
import { ChoiceCallout } from '../components/choice/InviteEntry.tsx'
import { CollectionDialog } from '../components/place/CollectionDialog.tsx'
import { PrimaryButton } from '../components/ui/Button.tsx'
import { ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { PinterestSearchBar } from '../components/search/PinterestSearchBar.tsx'

/** S-01 Khám phá — bố cục cột giữa gọn như MochiVocab kèm nền mây hai bên, lưới gợi ý 2 ảnh/hàng. */
export function DiscoverPage() {
  const { state } = useAuth()
  return (
    <>
      <DiscoverSideBackdrop />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-3xl border border-line/80 bg-white/95 p-4 shadow-raised sm:gap-10 sm:p-7 md:p-8">
        <h1 className="sr-only">Khám phá nơi hẹn hò</h1>
        {state.status === 'member' && <ContinueSection />}
        <SearchHero />
        <ChoiceCallout />
        <Collections />
      </div>
    </>
  )
}

/** Nền trời & mây hai bên khoảng trống màn hình rộng (tham khảo bố cục MochiVocab). */
function DiscoverSideBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-16 bottom-0 -z-10 overflow-hidden bg-[linear-gradient(180deg,#dff2fc_0%,#eef7fc_55%,#f4f8fa_100%)]"
    >
      {/* Quầng sáng mềm hai bên */}
      <div className="absolute -top-24 -left-24 hidden size-96 rounded-full bg-sky-100/55 blur-3xl lg:block" />
      <div className="absolute top-20 -right-24 hidden size-96 rounded-full bg-peach-50/80 blur-3xl lg:block" />

      {/* Đám mây trên bên trái */}
      <svg viewBox="0 0 260 120" className="absolute top-12 -left-10 hidden w-56 text-white/85 lg:block xl:w-72" fill="currentColor">
        <path d="M24 102h196c18 0 32-13 32-29 0-15-12-27-27-29-5-21-24-36-47-36-19 0-36 10-44 26-6-4-14-6-22-6-22 0-40 17-42 38-15 2-26 14-26 29 0 16 12 7 20 7Z" />
      </svg>

      {/* Đám mây trên bên phải */}
      <svg viewBox="0 0 260 120" className="absolute top-28 -right-10 hidden w-56 text-white/85 lg:block xl:w-72" fill="currentColor">
        <path d="M36 104h192c17 0 30-12 30-28s-13-28-29-29c-4-23-24-40-48-40-20 0-37 11-45 28-7-5-16-8-26-8-23 0-42 18-43 41-15 2-26 14-26 28 0 12 10 8 25 8Z" />
      </svg>

      {/* Lớp mây chân trời bên trái */}
      <svg viewBox="0 0 420 190" className="absolute bottom-0 -left-8 hidden w-80 text-white/95 lg:block xl:w-[440px]" fill="currentColor">
        <path d="M0 190V116c22-18 54-24 84-14 14-30 46-50 82-50 38 0 71 22 84 54 14-9 31-14 50-12 34 3 62 29 66 63 14 2 28 11 36 33H0Z" />
      </svg>

      {/* Lớp mây chân trời bên phải */}
      <svg viewBox="0 0 420 190" className="absolute -right-8 bottom-0 hidden w-80 text-white/95 lg:block xl:w-[440px]" fill="currentColor">
        <path d="M420 190V112c-22-17-54-22-82-12-15-31-47-52-84-52-37 0-70 21-83 52-15-8-33-11-51-8-33 5-59 31-63 64-15 3-28 13-37 34h400Z" />
      </svg>

      {/* Điểm nhấn trái tim & sao nhỏ hai bên lề */}
      <svg viewBox="0 0 24 24" className="absolute top-64 left-12 hidden size-7 text-heart/45 xl:block" fill="currentColor">
        <path d="M12 20.5s-7.2-4.5-9.4-8.8C1 8.4 3.1 4.5 6.8 4.5c2.1 0 3.4 1.2 5.2 3.2 1.8-2 3.1-3.2 5.2-3.2 3.7 0 5.8 3.9 4.2 7.2-2.2 4.3-9.4 8.8-9.4 8.8z" />
      </svg>
      <svg viewBox="0 0 24 24" className="absolute top-72 right-14 hidden size-6 text-sky/35 xl:block" fill="currentColor">
        <path d="M12 20.5s-7.2-4.5-9.4-8.8C1 8.4 3.1 4.5 6.8 4.5c2.1 0 3.4 1.2 5.2 3.2 1.8-2 3.1-3.2 5.2-3.2 3.7 0 5.8 3.9 4.2 7.2-2.2 4.3-9.4 8.8-9.4 8.8z" />
      </svg>
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
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
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
      <div className="grid items-start gap-3 sm:grid-cols-2">
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
  const [areaId, setAreaId] = useState('')
  const [budget, setBudget] = useState('')
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ACTIVITY' | 'OCCASION' | 'VIBE'>('ACTIVITY')

  const hero = useSiteContent().data?.homeHero

  const activities = (taxonomies.data ?? []).filter((t) => t.group === 'ACTIVITY' && t.status === 'ACTIVE')
  const occasions = (taxonomies.data ?? []).filter((t) => t.group === 'OCCASION' && t.status === 'ACTIVE')
  const vibes = (taxonomies.data ?? []).filter((t) => t.group === 'VIBE' && t.status === 'ACTIVE')

  function handleFilterSubmit() {
    const params = new URLSearchParams()
    if (areaId) params.set('areaId', areaId)
    if (budget) params.set('budget', budget)
    navigate(`/search?${params}`)
  }

  const currentCategoryTags =
    activeCategoryTab === 'ACTIVITY' ? activities : activeCategoryTab === 'OCCASION' ? occasions : vibes

  return (
    <section aria-labelledby="search-heading" className="flex flex-col gap-5">
      <div>
        <h2 id="search-heading" className="text-2xl leading-8 font-bold md:text-3xl md:leading-9 text-ink">
          {hero?.title || 'Tìm nơi hẹn hò lý tưởng'}
        </h2>
        <p className="mt-1 text-ink-muted">
          {hero?.subtitle || 'Khám phá quán cà phê, nhà hàng và không gian dành riêng cho hai người.'}
        </p>
      </div>

      {/* BẬC 1: THANH SEARCH NẰM RIÊNG MỘT BẬC VÀ TRẢI DÀI RA (Phong cách Pinterest Search) */}
      <div className="w-full">
        <PinterestSearchBar
          placeholder="Tìm quán cà phê, nhà hàng lãng mạn, workshop, rooftop…"
          onSubmitQuery={(q) => {
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (areaId) params.set('areaId', areaId)
            if (budget) params.set('budget', budget)
            navigate(`/search?${params}`)
          }}
        />
      </div>

      {/* BẬC 2: SẮP XẾP LẠI BỘ LỌC (FILTER LAYOUT) TRỰC QUAN & TINH GỌN */}
      <div className="rounded-2xl border border-line bg-page/55 p-4 md:p-5">
        <div className="flex flex-col gap-4">
          {/* Hàng filter nhanh: Khu vực + Ngân sách + Nút lọc */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[1.65fr_1.35fr_auto]">
            {/* Lọc Khu vực */}
            <label className="relative flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-muted">Khu vực hẹn hò</span>
              <div className="relative">
                <MapPin size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-action" aria-hidden="true" />
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="min-h-11 w-full rounded-control border border-field/40 bg-white pr-2 pl-9 text-sm font-medium text-ink transition-colors hover:border-action focus:border-action focus:outline-none"
                >
                  <option value="">Tất cả khu vực (Sài Gòn)</option>
                  {areas.data?.filter((a) => a.status === 'ACTIVE').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* Lọc Ngân sách */}
            <label className="relative flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-muted">Ngân sách cho 2 người</span>
              <div className="relative">
                <DollarSign size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-action" aria-hidden="true" />
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="min-h-11 w-full rounded-control border border-field/40 bg-white pr-2 pl-9 text-sm font-medium text-ink transition-colors hover:border-action focus:border-action focus:outline-none"
                >
                  <option value="">Mọi mức ngân sách</option>
                  {BUDGETS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* Nút lọc nhanh */}
            <div className="flex items-end">
              <PrimaryButton onClick={handleFilterSubmit} className="min-h-11 w-full px-4 whitespace-nowrap">
                <Filter size={16} aria-hidden="true" />
                <span>Lọc địa điểm</span>
              </PrimaryButton>
            </div>
          </div>

          {/* Phân nhóm Tags: Hoạt động, Dịp hẹn, Không khí */}
          <div className="border-t border-line/60 pt-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-bold text-ink-muted">Gợi ý theo chủ đề:</span>
              <div className="flex rounded-lg bg-page p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('ACTIVITY')}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    activeCategoryTab === 'ACTIVITY' ? 'bg-white text-action shadow-2xs font-bold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('OCCASION')}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    activeCategoryTab === 'OCCASION' ? 'bg-white text-action shadow-2xs font-bold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Dịp hẹn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('VIBE')}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    activeCategoryTab === 'VIBE' ? 'bg-white text-action shadow-2xs font-bold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Không khí
                </button>
              </div>
            </div>

            {currentCategoryTags.length > 0 && (
              <nav aria-label="Tìm nhanh theo chủ đề" className="-mx-2 overflow-x-auto px-2 pb-1 md:mx-0 md:px-0">
                <ul className="flex gap-2 md:flex-wrap">
                  {currentCategoryTags.map((tag) => (
                    <li key={tag.id}>
                      <Link
                        to={`/search?tagIds=${tag.id}${areaId ? `&areaId=${areaId}` : ''}${budget ? `&budget=${budget}` : ''}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-line bg-page/70 px-3.5 text-xs font-medium text-ink transition-colors hover:border-action hover:bg-action-soft hover:text-action whitespace-nowrap"
                      >
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Bộ sưu tập dạng thẻ ảnh 2 cột (2 ảnh/hàng). Bấm vào mở popup giữa màn hình, không chuyển trang;
 * id nằm trên URL (?collection=) để nút Quay lại đóng popup và gửi link được.
 */
function Collections() {
  const collections = useCollections()
  const [params, setParams] = useSearchParams()
  const openId = params.get('collection')
  const setOpen = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('collection', id)
    else next.delete('collection')
    setParams(next, { replace: !id, preventScrollReset: true })
  }

  if (collections.isError) return <ErrorState error={collections.error} onRetry={() => collections.refetch()} />
  if (collections.isPending)
    return (
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-[4/3]" />
        ))}
      </div>
    )
  if (collections.data.length === 0) return null // không có bộ sưu tập đang hiển thị: giữ tìm kiếm

  return (
    <section aria-labelledby="collections-heading">
      <h2 id="collections-heading" className="mb-3.5 text-xl font-bold text-ink">
        Gợi ý cho bạn
      </h2>
      <ul className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {collections.data.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setOpen(c.id)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-block border border-line bg-[linear-gradient(160deg,var(--color-sky-100),var(--color-action-soft)_55%,var(--color-peach-50))] text-left transition-transform hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-action motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {c.coverUrl && (
                <img src={c.coverUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgb(20_50_74/.78))] px-3.5 pt-8 pb-3 text-[15px] leading-5 font-semibold text-white sm:text-base">
                <span className="line-clamp-2">{c.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {openId && <CollectionDialog collectionId={openId} onClose={() => setOpen(null)} />}
    </section>
  )
}

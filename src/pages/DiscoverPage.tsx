import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, CalendarClock, MapPin, Sparkles, Users } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { useAuth } from '../app/auth.tsx'
import { useCollections, useSearchPlaces, useTaxonomies } from '../hooks/places.ts'
import { useSiteContent } from '../hooks/adminSupport.ts'
import { useMyChoiceSessions } from '../hooks/choice.ts'
import { isReminderDue, useDatePlans, useDismissedReminders } from '../hooks/plans.ts'
import { formatDateTime, priceForTwo } from '../lib/format.ts'
import { useNow } from '../hooks/useNow.ts'
import { VisitReminderTicket } from '../components/plan/VisitReminder.tsx'
import { ChoiceCallout } from '../components/choice/InviteEntry.tsx'
import { MOCKUP_TOPICS } from '../components/discover/CategoryThumb.tsx'
import { CollectionDialog } from '../components/place/CollectionDialog.tsx'
import { PlaceCard } from '../components/place/PlaceCard.tsx'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { AddToListButton, SaveButton } from '../components/place/SaveToList.tsx'
import { ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { PinterestSearchBar } from '../components/search/PinterestSearchBar.tsx'

const DEFAULT_HERO_TITLE = 'Tìm nơi hẹn hò'
const DEFAULT_HERO_SUBTITLE = 'Lọc theo khu vực, ngân sách cho hai người và việc hai bạn muốn làm.'

/** S-01 Khám phá — Bố cục & tông màu chuẩn theo mockup: Hero cặp đôi + thanh Gợi ý chủ đề + Đang hot & Cùng chọn. */
export function DiscoverPage() {
  const { state } = useAuth()
  return (
    <div className="flex flex-col gap-7">
      <h1 className="sr-only">Khám phá nơi hẹn hò</h1>
      <HeroAndTopics />
      {state.status === 'member' && <ContinueSection />}
      <HotAndChoiceBento />
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

function HeroAndTopics() {
  const navigate = useNavigate()
  const taxonomies = useTaxonomies()
  const placesPreview = useSearchPlaces({ size: 1 })
  const hero = useSiteContent().data?.homeHero

  const totalPlaces = placesPreview.data?.page?.totalElements
  const activities = (taxonomies.data ?? []).filter((t) => t.group === 'ACTIVITY' && t.status === 'ACTIVE')
  const customTitle = hero?.title && hero.title !== DEFAULT_HERO_TITLE ? hero.title : null
  const customSubtitle = hero?.subtitle && hero.subtitle !== DEFAULT_HERO_SUBTITLE ? hero.subtitle : null

  function topicHref(item: (typeof MOCKUP_TOPICS)[number]) {
    const matched = activities.find((a) => a.code === item.code)
    if (matched) return `/search?tagIds=${matched.id}`
    return `/search?q=${encodeURIComponent(item.fallbackQuery)}`
  }

  function renderTopicItem(item: (typeof MOCKUP_TOPICS)[number], isDuplicate = false) {
    return (
      <li key={isDuplicate ? `${item.key}-dup` : item.key} className="shrink-0">
        <Link
          to={topicHref(item)}
          tabIndex={isDuplicate ? -1 : undefined}
          className="group flex flex-col items-center gap-1 rounded-2xl px-2 py-1 transition-transform hover:-translate-y-0.5"
        >
          <span className="relative block h-10 w-[84px] overflow-hidden rounded-full bg-[#fdf4f5] shadow-2xs ring-1 ring-[#efe4e8]">
            <img
              src={item.image}
              alt=""
              onError={(e) => {
                e.currentTarget.src = item.fallbackImage
              }}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {/* Viền mây gợn sóng vector sắc nét dưới đáy mỗi viên thuốc chủ đề */}
            <svg
              viewBox="0 0 84 12"
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-2.5 w-full text-white/92"
              fill="currentColor"
            >
              <path d="M0 12V7c4-3 9-3 13 0 4-3.5 10-3.5 14 0 5-4 12-4 17 0 4-3.5 10-3.5 14 0 5-3.5 10-3.5 14 0 4-3 8-3 12 0v5H0Z" />
            </svg>
          </span>
          <span className="text-[12px] font-semibold whitespace-nowrap text-[#23304e] group-hover:text-[#e26b70]">
            {item.label}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <div className="min-w-0">
      {/* Khung Hero nằm gọn trong container; tách lớp nền overflow-hidden riêng để bảng tìm kiếm xổ xuống không bị cắt */}
      <section aria-labelledby="search-heading" className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[28px] bg-[#f6f0f5]"
        >
          {/* Ảnh cặp đôi bên phải đã làm nét 3x (không tràn ra ngoài khung) */}
          <img
            src="/images/hero-couple.png"
            alt=""
            className="absolute top-0 right-0 hidden h-full w-auto max-w-none select-none md:block"
          />

          {/* Hai trái tim vẽ tay sắc nét bằng Vector SVG phía trên cặp đôi */}
          <svg
            viewBox="0 0 88 46"
            className="absolute top-3 right-[195px] hidden h-8 w-16 text-white/95 drop-shadow-[0_1px_2px_rgba(68,94,148,0.18)] md:block"
            fill="none"
          >
            <path
              d="M21 38s-11-6.2-14-12.6C4.4 20 7.6 13.8 13 13.8c3.2 0 5.4 1.8 8 4.8 2.6-3 4.8-4.8 8-4.8 5.4 0 8.6 6.2 6 11.6C32 31.8 21 38 21 38Z"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M66 29s-8.5-4.8-10.8-9.8C53.2 15 55.6 10.2 59.8 10.2c2.5 0 4.2 1.4 6.2 3.7 2-2.3 3.7-3.7 6.2-3.7 4.2 0 6.6 4.8 4.6 9-2.3 5-10.8 9.8-10.8 9.8Z"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Dòng chữ doodle "Better dates, Happier you ♡" + đường cong vẽ tay sắc nét bằng Vector SVG */}
          <div className="absolute top-8 right-[64px] hidden -rotate-8 select-none md:block">
            <p
              className="text-[12.5px] leading-[1.22] font-semibold tracking-wide text-white/95 drop-shadow-[0_1px_2px_rgba(68,94,148,0.2)]"
              style={{ fontFamily: '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive' }}
            >
              Better dates,
              <br />
              Happier you ♡
            </p>
            <svg viewBox="0 0 64 20" className="mt-1 ml-3 h-3.5 w-12 text-white/90" fill="none">
              <path d="M4 15c18-1 38-7 54-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="relative px-4 pt-6 pb-8 md:w-[55%] md:px-6 md:pt-7 md:pb-10">
          {/* Nét vẽ doodle bên trái và trái tim vẽ tay bên phải tiêu đề giống bản thiết kế */}
          <div className="relative inline-block">
            <svg
              viewBox="0 0 24 32"
              aria-hidden="true"
              className="pointer-events-none absolute -top-1 -left-5 hidden h-6 w-4 text-[#23304e] md:block"
              fill="none"
            >
              <path d="M18 6L8 2M15 15L4 14M17 23L8 26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <svg
              viewBox="0 0 28 26"
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 -right-7 hidden h-5 w-5 rotate-12 text-[#e56b70] sm:block"
              fill="none"
            >
              <path
                d="M14 23s-8.5-5.2-11-10.2C1 8.8 3.5 4 7.8 4c2.5 0 4.2 1.4 6.2 3.8C16 5.4 17.7 4 20.2 4 24.5 4 27 8.8 25 12.8 22.5 17.8 14 23 14 23Z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <h2 id="search-heading" className="text-2xl leading-[1.18] font-extrabold tracking-tight text-[#23304e] sm:text-3xl md:text-[34px]">
              {customTitle ?? (
                <>
                  <span className="block">Buổi hẹn hoàn hảo</span>
                  <span className="mt-0.5 block">
                    chỉ cần{' '}
                    <span className="relative inline-block text-[#e56b70]">
                      GoWithBae
                      <svg
                        viewBox="0 0 120 10"
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-1 left-0 h-2 w-full text-[#efb1b4]"
                        fill="none"
                      >
                        <path d="M2 7c32-5 76-5 116-1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </span>
                </>
              )}
            </h2>
          </div>

          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-[#4a5578] sm:text-[14px]">
            {customSubtitle ?? (
              <>
                Khám phá{' '}
                <span className="font-bold text-[#e26b70] tabular">
                  {totalPlaces != null ? `${totalPlaces.toLocaleString('vi-VN')} địa điểm` : 'các địa điểm'}
                </span>{' '}
                phù hợp
                <br className="hidden sm:inline" /> với sở thích, ngân sách và mood của hai bạn.
              </>
            )}
          </p>

          {/* Thanh tìm kiếm pill trắng + nút Tìm kiếm hồng san hô dịu đúng màu mockup */}
          <div className="mt-4 max-w-[430px]">
            <PinterestSearchBar
              placeholder="Hôm nay thử gì mới…"
              submitLabel="Tìm kiếm"
              pillStyle
              onSubmitQuery={(q) => {
                const params = new URLSearchParams()
                if (q) params.set('q', q)
                navigate(`/search?${params}`)
              }}
            />
          </div>
        </div>
      </section>

      {/* Thanh + Gợi ý chủ đề dạng băng chuyền vô tận (infinity marquee): di chuột vào tạm dừng, thả chuột ra chạy tiếp */}
      <div className="relative z-10 -mt-4">
        <div className="flex items-center justify-between gap-2.5 rounded-[26px] border border-white bg-white/95 px-3 py-2.5 shadow-[0_10px_28px_rgba(35,48,78,0.06)] backdrop-blur sm:px-4">
          <div className="hidden shrink-0 items-center gap-1.5 rounded-2xl bg-[#fcf3f4] px-3 py-2.5 sm:flex">
            <Sparkles size={14} className="text-[#e56b70]" aria-hidden="true" />
            <span className="text-xs leading-tight font-bold text-[#23304e]">
              Gợi ý
              <br />
              chủ đề
            </span>
          </div>

          <nav
            aria-label="Tìm nhanh theo chủ đề"
            className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]"
          >
            <div className="animate-topic-marquee">
              <ul className="flex shrink-0 items-center gap-3 pr-3">
                {MOCKUP_TOPICS.map((item) => renderTopicItem(item, false))}
              </ul>
              <ul aria-hidden="true" className="flex shrink-0 items-center gap-3 pr-3">
                {MOCKUP_TOPICS.map((item) => renderTopicItem(item, true))}
              </ul>
            </div>
          </nav>

          <Link
            to="/search"
            className="hidden shrink-0 items-center gap-1 rounded-2xl bg-[#eef1fd] px-3.5 py-2.5 text-xs leading-tight font-semibold text-[#384670] transition-colors hover:bg-[#e1e6fc] md:inline-flex"
          >
            <span>
              Khám phá
              <br />
              thêm
            </span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Hàng nội dung chính: Trái (Đang hot — 2 ảnh 1 hàng để thoáng trong layout thu gọn) + Phải (Thẻ Cùng chọn). */
function HotAndChoiceBento() {
  const hot = useSearchPlaces({ size: 4 })

  return (
    <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-12">
      <section aria-labelledby="hot-heading" className="flex min-w-0 flex-col lg:col-span-7">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="hot-heading" className="flex items-center gap-1.5 text-[19px] font-extrabold text-[#23304e]">
            <span aria-hidden="true" className="text-lg leading-none">
              🔥
            </span>
            <span>Đang hot</span>
          </h2>
          <Link to="/search" className="inline-flex items-center gap-1 text-xs font-semibold text-[#4a5578] hover:text-[#23304e] hover:underline">
            <span>Xem thêm</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        {hot.isPending ? (
          <div className="grid grid-cols-2 gap-3.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : hot.isError ? (
          <ErrorState error={hot.error} onRetry={() => hot.refetch()} />
        ) : (
          <ul className="grid min-w-0 grid-cols-2 gap-3.5">
            {hot.data.items.slice(0, 4).map((p) => {
              const price = priceForTwo(p.price)
              const tagText = p.tags
                .slice(0, 2)
                .map((t) => t.name)
                .join(' · ')
              return (
                <li key={p.id} className="flex min-w-0">
                  <PlaceCard.Root
                    place={p}
                    className="w-full rounded-2xl border-[#efe3e6] bg-white shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-raised"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-[#f5eff5]">
                      <PlaceMedia url={p.coverUrl} name={p.name} />
                      {/* Tim (lưu vào "Đã lưu") + nút + (thêm vào danh sách đang chọn), kiểu trong suốt như thiết kế */}
                      <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                        <SaveButton placeId={p.id} placeName={p.name} variant="glass" />
                        <AddToListButton place={p} variant="glass" />
                      </div>
                      {(tagText || price) && (
                        <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 bottom-2 flex">
                          <span className="max-w-full truncate rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                            {[tagText, price].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <PlaceCard.Title className="text-[14px] leading-5 text-[#23304e]" />
                      <div className="mt-auto flex items-center justify-between gap-1 pt-0.5 text-[11.5px] text-[#66708a]">
                        <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
                          <MapPin size={11} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{p.areaName ?? 'Quận 1'}, HCM</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-[#5b647d] tabular">
                          <span className="text-[#f59e0b]" aria-hidden="true">
                            ★
                          </span>
                          <span>{price ?? 'Mới'}</span>
                        </span>
                      </div>
                    </div>
                  </PlaceCard.Root>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="min-w-0 lg:col-span-5">
        <ChoiceCallout />
      </div>
    </div>
  )
}

/**
 * Hỗ trợ mở popup bộ sưu tập (?collection=) mà không làm rối bố cục trang chủ mới.
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

  return (
    <>
      {collections.data && collections.data.length > 0 && (
        <section aria-labelledby="collections-heading" className="sr-only">
          <h2 id="collections-heading">Gợi ý cho bạn</h2>
          <ul>
            {collections.data.map((c) => (
              <li key={c.id}>
                <button type="button" aria-haspopup="dialog" onClick={() => setOpen(c.id)}>
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {openId && <CollectionDialog collectionId={openId} onClose={() => setOpen(null)} />}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { CalendarPlus, ChevronRight, Clock, Flag, MapPin, Navigation, Phone, Wallet } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { isStatus, problemMessage } from '../api/problem.ts'
import { loginHref, useAuth } from '../app/auth.tsx'
import { usePlace, useReportPlace } from '../hooks/places.ts'
import { track } from '../lib/analytics.ts'
import { DAY_NAMES, formatDistance, formatPlainDate, priceForTwo } from '../lib/format.ts'
import { describeDay, hoursOn, formatRanges } from '../lib/hours.ts'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { SaveButton, SaveToListDialog } from '../components/place/SaveToList.tsx'
import { CompareToggle } from '../components/place/Compare.tsx'
import { Dialog } from '../components/ui/Dialog.tsx'
import { Field } from '../components/ui/Field.tsx'
import { ButtonLink, GhostButton, PrimaryButton } from '../components/ui/Button.tsx'
import { ErrorState, Skeleton, UnknownValue } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'
import { useNow } from '../hooks/useNow.ts'

/** S-04 Chi tiết địa điểm — FR-05 (thứ tự nội dung cố định), FR-06/09/15/19. Không có sao/đánh giá. */
export function PlaceDetailPage() {
  const { placeId = '' } = useParams()
  const place = usePlace(placeId)

  useEffect(() => {
    if (place.data) track('place_viewed', { objectId: place.data.id })
  }, [place.data])

  if (place.isPending)
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="aspect-[4/3] md:aspect-[21/9]" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24" />
      </div>
    )
  if (place.isError)
    return isStatus(place.error, 404) ? <NotFoundPage title="Không tìm thấy địa điểm" /> : <ErrorState error={place.error} onRetry={() => place.refetch()} />
  return <PlaceDetail place={place.data} />
}

function PlaceDetail({ place }: { place: Schemas['PlaceDetail'] }) {
  const { state } = useAuth()
  const [params, setParams] = useSearchParams()
  const [reportOpen, setReportOpen] = useState(false)
  const member = state.status === 'member'
  const planHref = member ? `/plans/new?placeId=${place.id}` : loginHref(`/plans/new?placeId=${place.id}`)
  // Quay lại sau đăng nhập với intent=save → mở dialog lưu, không tự lưu (UX-06)
  const saveIntent = member && params.get('intent') === 'save'
  const closeIntent = () => {
    const next = new URLSearchParams(params)
    next.delete('intent')
    setParams(next, { replace: true })
  }

  const now = useNow()
  const today = describeDay(hoursOn(place.hours, new Date(now).toISOString()))
  const price = priceForTwo(place.price)
  const experience = place.tags.filter((t) => ['ACTIVITY', 'VIBE', 'STYLE', 'SCENERY', 'OCCASION'].includes(t.group))
  const amenities = place.tags.filter((t) => ['FEATURE', 'AMENITY'].includes(t.group))
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`

  return (
    <article className="pb-24 lg:pb-0">
      <nav aria-label="Đường dẫn" className="mb-3 hidden items-center gap-1 text-[13px] text-ink-muted md:flex">
        <Link to="/" className="hover:text-action">
          Khám phá
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        {place.area && (
          <>
            <Link to={`/search?areaId=${place.area.id}`} className="hover:text-action">
              {place.area.name}
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
          </>
        )}
        <span className="text-ink">{place.name}</span>
      </nav>

      <Gallery place={place} />

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <header>
            <h1 className="text-2xl leading-8 font-bold md:text-3xl md:leading-9">{place.name}</h1>
            <p className="mt-1 text-ink-muted">
              {[place.category?.name, place.area?.name].filter(Boolean).join(' · ') || 'Chưa có thông tin loại hình'}
              {place.distanceKm != null && ` · ${formatDistance(place.distanceKm)}`}
            </p>
            {/* "Đã đi X lần" (FR-35) chờ contract bổ sung myVisitCount — CCR-01 */}
          </header>

          {/* Dải thông tin quyết định (hướng B+) */}
          <dl className="grid grid-cols-3 gap-2">
            <Fact icon={<Wallet size={18} />} label="Giá cho hai người">
              {price ? <span className="tabular">{price}</span> : <UnknownValue />}
            </Fact>
            <Fact icon={<Clock size={18} />} label="Hôm nay">
              {today.startsWith('Chưa') ? <UnknownValue>Chưa có thông tin giờ</UnknownValue> : <span className="tabular">{today}</span>}
            </Fact>
            <Fact icon={<MapPin size={18} />} label="Khu vực">
              {place.area?.name ?? <UnknownValue />}
            </Fact>
          </dl>

          <Section title="Giá">
            {price ? (
              <p>
                <span className="font-semibold tabular">{price}</span> cho hai người
                {place.price.min != null && place.price.max != null && place.price.max > 0 && (
                  <span className="text-ink-muted tabular">
                    {' '}
                    (khoảng {place.price.min.toLocaleString('vi-VN')}–{place.price.max.toLocaleString('vi-VN')} ₫)
                  </span>
                )}
                {place.price.includes && <span className="block text-sm text-ink-muted">Gồm: {place.price.includes}</span>}
              </p>
            ) : (
              <UnknownValue>Chưa có thông tin giá</UnknownValue>
            )}
          </Section>

          <Section title="Trải nghiệm">
            {place.description ? <p className="max-w-[70ch]">{place.description}</p> : <UnknownValue>Chưa có mô tả</UnknownValue>}
            {experience.length > 0 && <TagList tags={experience} />}
          </Section>

          <Section title="Tiện ích">
            {amenities.length ? <TagList tags={amenities} /> : <UnknownValue />}
          </Section>

          <Section title="Giờ mở cửa và địa chỉ">
            <HoursTable hours={place.hours} />
            <p className="mt-3 flex items-start gap-2">
              <MapPin size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
              {place.address}
            </p>
          </Section>

          <Section title="Lưu ý">
            {place.reservationRecommended && <p>Nên liên hệ đặt trước với địa điểm.</p>}
            {place.notes ? <p>{place.notes}</p> : !place.reservationRecommended && <UnknownValue>Chưa có lưu ý</UnknownValue>}
          </Section>

          <footer className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-muted">
            <span>Cập nhật: {place.verifiedAt ? formatPlainDate(place.verifiedAt) : 'chưa có thông tin'}</span>
            <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 hover:text-action">
              <Flag size={16} aria-hidden="true" /> Báo thông tin sai
            </button>
          </footer>
        </div>

        {/* Cột quyết định: desktop sticky, mobile thành action bar đáy */}
        <aside aria-label="Hành động" className="hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-3 rounded-block border border-line bg-white p-4">
            <p className="text-[13px] text-ink-muted">Giá cho hai người</p>
            <p className="-mt-2 text-xl font-bold tabular">{price ?? <UnknownValue />}</p>
            <ButtonLink to={planHref} icon={<CalendarPlus size={18} aria-hidden="true" />}>
              Lên kế hoạch
            </ButtonLink>
            <div className="flex gap-2">
              <SaveButton placeId={place.id} placeName={place.name} variant="labelled" />
              <CompareToggle placeId={place.id} placeName={place.name} />
            </div>
            <div className="flex gap-2 border-t border-line pt-3">
              {place.phone && (
                <a href={`tel:${place.phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-sm text-ink-muted hover:bg-page">
                  <Phone size={16} aria-hidden="true" /> Gọi
                </a>
              )}
              <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-control text-sm text-ink-muted hover:bg-page">
                <Navigation size={16} aria-hidden="true" /> Chỉ đường
              </a>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-line bg-white px-4 pt-2.5 pb-[max(.625rem,env(safe-area-inset-bottom))] shadow-raised lg:hidden">
        <SaveButton placeId={place.id} placeName={place.name} />
        <CompareToggle placeId={place.id} placeName={place.name} />
        <a href={directions} target="_blank" rel="noopener noreferrer" aria-label="Chỉ đường" className="inline-flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-page">
          <Navigation size={20} aria-hidden="true" />
        </a>
        <ButtonLink to={planHref} className="flex-1">
          Lên kế hoạch
        </ButtonLink>
      </div>

      {saveIntent && <SaveToListDialog placeId={place.id} placeName={place.name} onClose={closeIntent} />}
      <ReportPlaceDialog placeId={place.id} placeName={place.name} open={reportOpen} onClose={() => setReportOpen(false)} />
    </article>
  )
}

function Gallery({ place }: { place: Schemas['PlaceDetail'] }) {
  const images = [...place.images].sort((a, b) => Number(b.cover) - Number(a.cover) || a.sortOrder - b.sortOrder)
  const [index, setIndex] = useState(0)
  const current = images[index]
  return (
    <div className="relative -mx-4 aspect-[4/3] overflow-hidden bg-action-soft md:mx-0 md:aspect-[21/9] md:rounded-block" aria-roledescription="carousel" aria-label={`Ảnh ${place.name}`}>
      <PlaceMedia url={current?.url} name={place.name} eager />
      {images.length > 1 && (
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-ink/70 p-1 text-white">
          <button type="button" aria-label="Ảnh trước" className="rounded-full p-2 hover:bg-white/15" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}>
            <ChevronRight size={16} className="rotate-180" aria-hidden="true" />
          </button>
          <span className="text-xs tabular" aria-live="polite">
            {index + 1}/{images.length}
          </span>
          <button type="button" aria-label="Ảnh sau" className="rounded-full p-2 hover:bg-white/15" onClick={() => setIndex((i) => (i + 1) % images.length)}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-block border border-line bg-white p-2.5 sm:flex-row sm:items-start sm:gap-3 sm:p-3">
      <span className="text-action sm:mt-0.5" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-muted">{label}</dt>
        <dd className="text-sm font-semibold break-words sm:text-[15px]">{children}</dd>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-block border border-line bg-white p-4">
      <h2 className="mb-2 text-[17px] font-semibold">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function TagList({ tags }: { tags: Schemas['Taxonomy'][] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <li key={t.id} className="rounded-full bg-action-soft px-3 py-1 text-[13px] text-action-hover">
          {t.name}
        </li>
      ))}
    </ul>
  )
}

function HoursTable({ hours }: { hours: Schemas['OpeningHours'] }) {
  const now = useNow()
  if (hours.status !== 'KNOWN') return <UnknownValue>Chưa có thông tin giờ mở cửa</UnknownValue>
  const todayIndex = new Date(now).toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short' })
  const todayDow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(todayIndex) + 1
  return (
    <table className="w-full max-w-sm text-sm">
      <caption className="sr-only">Giờ mở cửa theo tuần (giờ Việt Nam)</caption>
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const day = hours.weekly?.find((w) => w.dayOfWeek === d)
          return (
            <tr key={d} className={d === todayDow ? 'font-semibold' : ''}>
              <th scope="row" className="py-1 pr-4 text-left font-normal text-ink-muted">
                {DAY_NAMES[d]}
                {d === todayDow && <span className="sr-only"> (hôm nay)</span>}
              </th>
              <td className="py-1 text-right tabular">{day?.ranges.length ? formatRanges(day.ranges) : 'Nghỉ'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const REASONS: { value: Schemas['PlaceReportReason']; label: string }[] = [
  { value: 'WRONG_PRICE', label: 'Sai giá' },
  { value: 'WRONG_HOURS', label: 'Sai giờ mở cửa' },
  { value: 'WRONG_ADDRESS', label: 'Sai địa chỉ' },
  { value: 'CLOSED', label: 'Địa điểm đã đóng cửa' },
  { value: 'WRONG_IMAGE', label: 'Ảnh không đúng' },
  { value: 'OTHER', label: 'Khác' },
]

/** FR-19: khách không cần đăng nhập; thông tin công khai không đổi ngay (AC-029/030). Ảnh đính kèm: chờ OQ-21. */
function ReportPlaceDialog({ placeId, placeName, open, onClose }: { placeId: string; placeName: string; open: boolean; onClose: () => void }) {
  const report = useReportPlace(placeId)
  const toast = useToast()
  const navigate = useNavigate()
  const [reason, setReason] = useState<Schemas['PlaceReportReason'] | ''>('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string>()

  const close = () => {
    report.reset()
    setReason('')
    setDescription('')
    setError(undefined)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Báo thông tin sai"
      description={placeName}
      footer={
        report.isSuccess ? (
          <PrimaryButton onClick={close}>Đóng</PrimaryButton>
        ) : (
          <>
            <GhostButton onClick={close}>Hủy</GhostButton>
            <PrimaryButton
              pending={report.isPending}
              onClick={() => {
                if (!reason) return setError('Hãy chọn loại thông tin sai')
                report.mutate({ reason, description: description.trim() || undefined }, { onError: (e) => toast.show(problemMessage(e), { tone: 'error' }) })
              }}
            >
              Gửi báo cáo
            </PrimaryButton>
          </>
        )
      }
    >
      {report.isSuccess ? (
        <div role="status" className="flex flex-col gap-2">
          <p className="font-semibold">Cảm ơn bạn. Đội ngũ sẽ kiểm tra thông tin này.</p>
          <p className="text-sm text-ink-muted">
            Mã báo cáo: <span className="tabular">{report.data.id.slice(-8).toUpperCase()}</span>. Thông tin trên trang chưa thay đổi cho đến khi được kiểm tra.
          </p>
          <button type="button" className="self-start text-sm text-action hover:underline" onClick={() => navigate('/')}>
            Về Khám phá
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Thông tin nào chưa đúng?</legend>
            <div className="grid gap-1 sm:grid-cols-2">
              {REASONS.map((r) => (
                <label key={r.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-line px-3 has-checked:border-action has-checked:bg-action-soft">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => {
                      setReason(r.value)
                      setError(undefined)
                    }}
                    className="size-4 accent-action"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            {error && (
              <p role="alert" className="mt-2 text-[13px] text-danger">
                {error}
              </p>
            )}
          </fieldset>
          <Field.Root>
            <Field.Label optional>Mô tả</Field.Label>
            <Field.Textarea rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="vd. Giá hiện tại là 350.000 ₫ cho hai người…" />
          </Field.Root>
        </div>
      )}
    </Dialog>
  )
}

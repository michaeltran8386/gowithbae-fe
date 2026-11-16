import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { CalendarPlus, Lock, MapPin, Navigation, Pencil, TriangleAlert } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { isStatus, problemMessage } from '../api/problem.ts'
import { downloadCalendar, isReminderDue, useDatePlan, useDismissedReminders, usePlanMutations } from '../hooks/plans.ts'
import { VN_TZ, priceForTwo } from '../lib/format.ts'
import { useNow } from '../hooks/useNow.ts'
import { NotReservedNotice, PlanStatusBadge } from '../components/plan/PlanBits.tsx'
import { VisitReminderTicket } from '../components/plan/VisitReminder.tsx'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { ConfirmDialog } from '../components/ui/Dialog.tsx'
import { ButtonLink, DangerButton, SecondaryButton } from '../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { Heart } from '../components/ui/Heart.tsx'
import { useToast } from '../components/ui/Toast.tsx'

const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, hour: '2-digit', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** S-15 Chi tiết buổi hẹn — FR-16/17/18. Chủ: sửa/hủy; người nhận (phiên khách): chỉ xem (RULE-14). */
export function PlanDetailPage() {
  const { planId = '' } = useParams()
  const plan = useDatePlan(planId)

  if (plan.isPending) return <Skeleton className="h-96" />
  if (plan.isError)
    return isStatus(plan.error, 404, 401) ? (
      <EmptyState icon={<Lock size={32} />} title="Không tìm thấy buổi hẹn">
        Buổi hẹn không tồn tại hoặc bạn không còn quyền xem.
      </EmptyState>
    ) : (
      <ErrorState error={plan.error} onRetry={() => plan.refetch()} />
    )
  return <PlanDetail plan={plan.data} />
}

function PlanDetail({ plan }: { plan: Schemas['DatePlan'] }) {
  const { cancel } = usePlanMutations(plan.id)
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const now = useNow()
  const dismissed = useDismissedReminders()
  const owner = plan.viewerRole === 'OWNER'
  const editable = owner && plan.status === 'SCHEDULED' && new Date(plan.scheduledAt).getTime() > now
  const date = new Date(plan.scheduledAt)
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${plan.place.lat},${plan.place.lng}`
  const hoursUnknown = plan.warnings?.some((w) => w.code === 'HOURS_UNKNOWN')

  return (
    <div className="mx-auto max-w-3xl">
      {owner && (
        <Link to="/plans" className="text-sm text-action hover:underline">
          Buổi hẹn
        </Link>
      )}

      {/* Đầu trang dạng vé hẹn (B+) */}
      <section
        aria-labelledby="plan-heading"
        className={`ticket-notch mt-2 overflow-hidden rounded-ticket border border-line bg-white [--notch-y:68%] ${plan.status === 'CANCELLED' ? 'grayscale' : ''}`}
      >
        <div className="flex flex-col gap-3 bg-[linear-gradient(160deg,var(--color-action-soft),#fff_70%)] p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <PlanStatusBadge status={plan.status} />
            {!owner && <Badge tone="muted">Bạn đang xem kế hoạch được chia sẻ</Badge>}
          </div>
          <h1 id="plan-heading" className="flex flex-col">
            <span className="text-3xl leading-tight font-bold tabular md:text-4xl">{timeFmt.format(date)}</span>
            <span className="text-lg font-semibold first-letter:uppercase">{dateFmt.format(date)}</span>
            <span className="sr-only">tại {plan.place.name}</span>
          </h1>
          <p className="text-[13px] text-ink-muted">Giờ Việt Nam</p>
        </div>
        <div className="flex items-center gap-3 border-t-2 border-dashed border-line p-5 md:p-6">
          <div className="size-16 shrink-0 overflow-hidden rounded-control">
            <PlaceMedia url={plan.place.coverUrl} name={plan.place.name} />
          </div>
          <div className="min-w-0 flex-1">
            {plan.placeAvailable === false ? (
              <p className="font-semibold">{plan.place.name}</p>
            ) : (
              <Link to={`/places/${plan.place.id}`} className="font-semibold hover:text-action">
                {plan.place.name}
              </Link>
            )}
            <p className="flex items-center gap-1 text-[13px] text-ink-muted">
              <MapPin size={14} aria-hidden="true" />
              {plan.place.areaName ?? 'Chưa có thông tin khu vực'} · <span className="tabular">{priceForTwo(plan.place.price) ?? 'Chưa có thông tin giá'}</span>
            </p>
            {/* "Đã đi X lần" (FR-35) chờ contract bổ sung myVisitCount — CCR-01 */}
            {owner && plan.visitAnswer === 'YES' && (
              <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-attention">
                <Heart size={14} /> Bạn đã xác nhận đã đi buổi hẹn này
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        {isReminderDue(plan, now, dismissed) && <VisitReminderTicket plan={plan} showPlaceLink={false} />}

        {plan.placeAvailable === false && (
          <p className="flex items-start gap-2 rounded-control bg-peach-50 px-3.5 py-3 text-sm text-attention">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            Địa điểm này hiện không còn hiển thị. Hãy kiểm tra lại hoặc đổi sang nơi khác.
          </p>
        )}
        {hoursUnknown && plan.status === 'SCHEDULED' && (
          <p className="flex items-start gap-2 rounded-control bg-peach-50 px-3.5 py-3 text-sm text-attention">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            Chưa có thông tin giờ mở cửa. Hãy kiểm tra với địa điểm trước khi đi.
          </p>
        )}

        <section className="rounded-block border border-line bg-white p-4">
          <h2 className="mb-1 text-[17px] font-semibold">Ghi chú</h2>
          <p className={plan.note ? 'whitespace-pre-line' : 'text-ink-muted'}>{plan.note || 'Chưa có ghi chú'}</p>
        </section>

        <NotReservedNotice />

        {plan.status !== 'CANCELLED' && (
          <div className="flex flex-wrap gap-2">
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-sky-100 bg-action-soft px-4 text-sm font-semibold text-action-hover hover:bg-sky-100"
            >
              <Navigation size={18} aria-hidden="true" /> Chỉ đường
            </a>
            <SecondaryButton
              icon={<CalendarPlus size={18} aria-hidden="true" />}
              onClick={() => downloadCalendar(plan.id).catch((e) => toast.show(problemMessage(e), { tone: 'error' }))}
            >
              Thêm vào lịch
            </SecondaryButton>
          </div>
        )}
        {plan.status !== 'CANCELLED' && (
          <p className="-mt-2 text-[13px] text-ink-muted">Tệp lịch là bản một lần. Nếu đổi giờ, hãy thêm lại vào lịch của bạn.</p>
        )}

        {editable && (
          <div className="mt-2 flex flex-wrap justify-between gap-2 border-t border-line pt-4">
            <ButtonLink to={`/plans/${plan.id}/edit`} variant="secondary" icon={<Pencil size={16} aria-hidden="true" />}>
              Sửa kế hoạch
            </ButtonLink>
            <DangerButton onClick={() => setConfirmCancel(true)}>Hủy buổi hẹn</DangerButton>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Hủy buổi hẹn này?"
        description="Kế hoạch sẽ chuyển sang Đã hủy và không thể mở lại. Lời nhắc của buổi hẹn cũng không còn hiển thị."
        confirmLabel="Hủy buổi hẹn"
        pending={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(undefined, {
            onSuccess: () => {
              setConfirmCancel(false)
              toast.show('Đã hủy buổi hẹn')
            },
            onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
          })
        }
      />
    </div>
  )
}

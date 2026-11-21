import { useState } from 'react'
import { useParams } from 'react-router'
import { CalendarPlus, LinkIcon, MapPin, Navigation, TriangleAlert, UserRoundCheck, UserRoundX } from 'lucide-react'
import { fieldErrors, isStatus, problemMessage } from '../api/problem.ts'
import { downloadInviteCalendar, usePlanInviteView, useRespondPlanInvite } from '../hooks/plans.ts'
import { VN_TZ, priceForTwo } from '../lib/format.ts'
import { NotReservedNotice, PlanStatusBadge } from '../components/plan/PlanBits.tsx'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { Field } from '../components/ui/Field.tsx'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'

const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, hour: '2-digit', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** Người ấy mở link mời xem kế hoạch: không cần tài khoản, không thấy ghi chú riêng; trả lời có đi hay không. */
export function PlanInvitePage() {
  const { token = '' } = useParams()
  const view = usePlanInviteView(token)

  if (view.isPending) return <Skeleton className="h-96" />
  if (view.isError)
    return isStatus(view.error, 410, 404, 400) ? (
      <EmptyState icon={<LinkIcon size={32} />} title="Link mời không còn hiệu lực" headingLevel={1}>
        Link có thể đã bị thu hồi, đã có link mới thay thế, hoặc buổi hẹn đã qua. Hãy hỏi người gửi link mới.
      </EmptyState>
    ) : (
      <ErrorState error={view.error} onRetry={() => view.refetch()} />
    )
  return <InviteView token={token} v={view.data} />
}

function InviteView({ token, v }: { token: string; v: NonNullable<ReturnType<typeof usePlanInviteView>['data']> }) {
  const respond = useRespondPlanInvite(token)
  const toast = useToast()
  const [name, setName] = useState(v.guestName ?? '')
  const date = new Date(v.scheduledAt)
  const open = v.status === 'SCHEDULED'
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${v.place.lat},${v.place.lng}`
  const nameError = respond.error ? fieldErrors(respond.error).guestName : undefined

  const answer = (response: 'GOING' | 'NOT_GOING') =>
    respond.mutate(
      { response, guestName: name.trim() || undefined },
      {
        onSuccess: () => toast.show(response === 'GOING' ? 'Đã báo bạn sẽ đi' : 'Đã báo bạn không đi được'),
        onError: (e) => !fieldErrors(e).guestName && toast.show(problemMessage(e), { tone: 'error' }),
      },
    )

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <p className="text-sm text-ink-muted">
        <b className="text-ink">{v.ownerName}</b> mời bạn đi hẹn
      </p>

      <section aria-labelledby="invite-plan-heading" className={`overflow-hidden rounded-ticket border border-line bg-white ${v.status === 'CANCELLED' ? 'grayscale' : ''}`}>
        <div className="flex flex-col gap-2 bg-[linear-gradient(160deg,var(--color-action-soft),#fff_70%)] p-5">
          <PlanStatusBadge status={v.status} />
          <h1 id="invite-plan-heading" className="flex flex-col">
            <span className="text-3xl leading-tight font-bold tabular">{timeFmt.format(date)}</span>
            <span className="text-lg font-semibold first-letter:uppercase">{dateFmt.format(date)}</span>
            <span className="sr-only">tại {v.place.name}</span>
          </h1>
          <p className="text-[13px] text-ink-muted">Giờ Việt Nam</p>
        </div>
        <div className="flex items-center gap-3 border-t-2 border-dashed border-line p-5">
          <div className="size-16 shrink-0 overflow-hidden rounded-control">
            <PlaceMedia url={v.place.coverUrl} name={v.place.name} />
          </div>
          <div className="min-w-0 flex-1">
            {v.placeAvailable === false ? (
              <p className="font-semibold">{v.place.name}</p>
            ) : (
              <a href={`/places/${v.place.id}`} target="_blank" rel="noreferrer" className="font-semibold hover:text-action">
                {v.place.name}
              </a>
            )}
            <p className="flex items-center gap-1 text-[13px] text-ink-muted">
              <MapPin size={14} aria-hidden="true" />
              {v.place.areaName ?? 'Chưa có thông tin khu vực'} · <span className="tabular">{priceForTwo(v.place.price) ?? 'Chưa có thông tin giá'}</span>
            </p>
          </div>
        </div>
      </section>

      {v.warnings?.map((w) => (
        <p key={w.code} className="flex items-start gap-2 rounded-control bg-peach-50 px-3.5 py-3 text-sm text-attention">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {w.message}
        </p>
      ))}

      {open ? (
        <section aria-labelledby="respond-heading" className="rounded-block border border-line bg-white p-4">
          <h2 id="respond-heading" className="text-[17px] font-semibold">
            Bạn có đi không?
          </h2>
          {v.response && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-action">
              {v.response === 'GOING' ? <UserRoundCheck size={16} aria-hidden="true" /> : <UserRoundX size={16} aria-hidden="true" />}
              Bạn đã trả lời: {v.response === 'GOING' ? 'Mình sẽ đi' : 'Không đi được'}. Có thể đổi lại bên dưới.
            </p>
          )}
          <Field.Root className="mt-3" error={nameError} hint>
            <Field.Label optional>Tên của bạn</Field.Label>
            <Field.Hint>Để {v.ownerName} biết ai trả lời.</Field.Hint>
            <Field.Input value={name} maxLength={50} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
            <Field.Error />
          </Field.Root>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton
              icon={<UserRoundCheck size={18} aria-hidden="true" />}
              pending={respond.isPending && respond.variables?.response === 'GOING'}
              onClick={() => answer('GOING')}
            >
              Mình sẽ đi
            </PrimaryButton>
            <SecondaryButton
              icon={<UserRoundX size={18} aria-hidden="true" />}
              pending={respond.isPending && respond.variables?.response === 'NOT_GOING'}
              onClick={() => answer('NOT_GOING')}
            >
              Không đi được
            </SecondaryButton>
          </div>
        </section>
      ) : (
        <p className="rounded-control bg-page px-3.5 py-3 text-sm text-ink-muted">
          {v.status === 'CANCELLED' ? 'Buổi hẹn này đã bị hủy.' : 'Buổi hẹn này đã qua.'}
        </p>
      )}

      {v.status !== 'CANCELLED' && (
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
            onClick={() => downloadInviteCalendar(token).catch((e) => toast.show(problemMessage(e), { tone: 'error' }))}
          >
            Thêm vào lịch
          </SecondaryButton>
        </div>
      )}
      <NotReservedNotice />
    </div>
  )
}

import { useNavigate, useSearchParams } from 'react-router'
import { isStatus } from '../api/problem.ts'
import { usePlace } from '../hooks/places.ts'
import { useCreateDatePlan } from '../hooks/plans.ts'
import { useIdempotencyKey } from '../lib/idempotency.ts'
import { priceForTwo } from '../lib/format.ts'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { PlanForm } from '../components/plan/PlanForm.tsx'
import { ButtonLink } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'

/** S-14 Tạo kế hoạch — FR-15, RULE-05/13. Không cần cùng chọn trước. */
export function PlanNewPage() {
  const [params] = useSearchParams()
  const placeId = params.get('placeId') ?? ''
  const place = usePlace(placeId)
  const create = useCreateDatePlan()
  const idem = useIdempotencyKey()
  const navigate = useNavigate()
  const toast = useToast()

  if (!placeId)
    return (
      <EmptyState title="Chọn địa điểm trước" action={<ButtonLink to="/">Khám phá địa điểm</ButtonLink>}>
        Mở một địa điểm rồi bấm “Lên kế hoạch”.
      </EmptyState>
    )
  if (place.isPending) return <Skeleton className="h-80" />
  if (place.isError)
    return isStatus(place.error, 404) ? (
      <EmptyState title="Địa điểm không còn hiển thị" action={<ButtonLink to="/">Chọn nơi khác</ButtonLink>}>
        Không thể tạo kế hoạch mới với địa điểm này.
      </EmptyState>
    ) : (
      <ErrorState error={place.error} onRetry={() => place.refetch()} />
    )

  const p = place.data
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Lên kế hoạch buổi hẹn</h1>
      <div className="mt-4 flex items-center gap-3 rounded-block border border-line bg-white p-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-control">
          <PlaceMedia url={p.images.find((i) => i.cover)?.url} name={p.name} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{p.name}</p>
          <p className="text-[13px] text-ink-muted">
            {p.area?.name ?? 'Chưa có thông tin khu vực'} · <span className="tabular">{priceForTwo(p.price) ?? 'Chưa có thông tin giá'}</span>
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-block border border-line bg-white p-4 md:p-5">
        <PlanForm
          hours={p.hours}
          submitLabel="Lưu kế hoạch"
          pending={create.isPending}
          error={create.error}
          onChange={() => {
            idem.reset()
            create.reset()
          }}
          onSubmit={({ scheduledAt, note }) =>
            create.mutate(
              { placeId: p.id, scheduledAt, note: note || undefined, idempotencyKey: idem.get() },
              {
                onSuccess: (plan) => {
                  toast.show('Đã lưu kế hoạch')
                  navigate(`/plans/${plan.id}`, { replace: true })
                },
              },
            )
          }
        />
      </div>
    </div>
  )
}

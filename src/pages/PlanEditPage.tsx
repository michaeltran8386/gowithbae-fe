import { useNavigate, useParams } from 'react-router'
import { isStatus } from '../api/problem.ts'
import { useDatePlan, usePlanMutations } from '../hooks/plans.ts'
import { usePlace } from '../hooks/places.ts'
import { PlanForm } from '../components/plan/PlanForm.tsx'
import { ButtonLink } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'

/** Sửa giờ / ghi chú kế hoạch — FR-16. Đổi địa điểm: dùng "Lên kế hoạch" ở nơi mới (giữ đơn giản cho F1). */
export function PlanEditPage() {
  const { planId = '' } = useParams()
  const plan = useDatePlan(planId)
  const place = usePlace(plan.data?.place.id ?? '')
  const { update } = usePlanMutations(planId)
  const navigate = useNavigate()
  const toast = useToast()

  if (plan.isPending) return <Skeleton className="h-80" />
  if (plan.isError)
    return isStatus(plan.error, 404) ? <EmptyState title="Không tìm thấy buổi hẹn" /> : <ErrorState error={plan.error} onRetry={() => plan.refetch()} />

  const p = plan.data
  if (p.viewerRole !== 'OWNER' || p.status !== 'SCHEDULED')
    return (
      <EmptyState title="Không sửa được kế hoạch này" action={<ButtonLink to={`/plans/${p.id}`}>Xem buổi hẹn</ButtonLink>}>
        Chỉ người tạo được sửa kế hoạch đang lên lịch.
      </EmptyState>
    )

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Sửa kế hoạch</h1>
      <p className="mt-1 text-ink-muted">{p.place.name}</p>
      <div className="mt-5 rounded-block border border-line bg-white p-4 md:p-5">
        <PlanForm
          hours={place.data?.hours}
          initial={{ scheduledAt: p.scheduledAt, note: p.note }}
          submitLabel="Lưu thay đổi"
          pending={update.isPending}
          error={update.error}
          onChange={() => update.reset()}
          onSubmit={({ scheduledAt, note }) =>
            update.mutate(
              { scheduledAt, note: note || null },
              {
                onSuccess: () => {
                  toast.show('Đã lưu thay đổi')
                  navigate(`/plans/${p.id}`, { replace: true })
                },
              },
            )
          }
        />
      </div>
    </div>
  )
}

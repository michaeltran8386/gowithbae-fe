import { Link } from 'react-router'
import type { Schemas } from '../../api/client.ts'
import { VN_TZ } from '../../lib/format.ts'
import { PlanStatusBadge } from './PlanBits.tsx'

const day = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, day: '2-digit' })
const month = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, month: 'short' })
const weekdayTime = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, weekday: 'long', hour: '2-digit', minute: '2-digit' })

/** Thẻ kế hoạch dạng cuống vé: ngày bên trái, nội dung bên phải (B+). */
export function PlanCard({ plan }: { plan: Schemas['DatePlan'] }) {
  const d = new Date(plan.scheduledAt)
  return (
    <Link
      to={`/plans/${plan.id}`}
      className={`flex items-stretch overflow-hidden rounded-block border border-line bg-white hover:border-action ${plan.status === 'CANCELLED' ? 'opacity-70' : ''}`}
    >
      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-line bg-action-soft py-3 text-action-hover">
        <span className="text-2xl leading-none font-bold tabular">{day.format(d)}</span>
        <span className="text-xs">{month.format(d)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3.5">
        <span className="truncate font-semibold">{plan.place.name}</span>
        <span className="text-[13px] text-ink-muted tabular first-letter:uppercase">{weekdayTime.format(d)}</span>
        <span className="mt-1">
          <PlanStatusBadge status={plan.status} />
        </span>
      </div>
    </Link>
  )
}

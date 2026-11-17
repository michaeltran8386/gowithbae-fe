import { Info } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { Badge } from '../ui/StateView.tsx'

/** Câu bắt buộc FR-15 / AC-023 — luôn hiển thị trên kế hoạch (G1 không giữ chỗ). */
export function NotReservedNotice() {
  return (
    <p className="flex items-start gap-2 rounded-control bg-action-soft px-3.5 py-3 text-sm text-action-hover">
      <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      Kế hoạch này chưa giữ chỗ tại địa điểm
    </p>
  )
}

const STATUS: Record<Schemas['DatePlanStatus'], { label: string; tone: 'action' | 'muted' }> = {
  SCHEDULED: { label: 'Đã lên lịch', tone: 'action' },
  CANCELLED: { label: 'Đã hủy', tone: 'muted' },
  PAST: { label: 'Đã qua giờ', tone: 'muted' },
}

export function PlanStatusBadge({ status }: { status: Schemas['DatePlanStatus'] }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
}

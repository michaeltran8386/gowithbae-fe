import { Link } from 'react-router'
import { ChevronRight, Plus } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { useMyTickets } from '../hooks/account.ts'
import { formatRelative } from '../lib/format.ts'
import { ButtonLink } from '../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'

export const TICKET_STATUS: Record<Schemas['TicketStatus'], { label: string; tone: 'action' | 'attention' | 'muted' | 'neutral' }> = {
  NEW: { label: 'Mới', tone: 'neutral' },
  IN_PROGRESS: { label: 'Đang xử lý', tone: 'action' },
  WAITING_CUSTOMER: { label: 'Chờ bạn phản hồi', tone: 'attention' },
  CLOSED: { label: 'Đã đóng', tone: 'muted' },
}

/** S-18 Hỗ trợ — FR-20: chỉ yêu cầu của chính thành viên. */
export function SupportListPage() {
  const tickets = useMyTickets()
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Hỗ trợ</h1>
        <ButtonLink to="/account/support/new" icon={<Plus size={18} aria-hidden="true" />}>
          Gửi yêu cầu
        </ButtonLink>
      </div>
      <div className="mt-5">
        {tickets.isPending ? (
          <Skeleton className="h-40" />
        ) : tickets.isError ? (
          <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} />
        ) : tickets.data.length === 0 ? (
          <EmptyState title="Chưa có yêu cầu hỗ trợ">Gặp vấn đề với tài khoản, địa điểm hay buổi hẹn? Gửi yêu cầu và theo dõi phản hồi tại đây.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {tickets.data.map((t) => (
              <li key={t.id}>
                <Link to={`/account/support/${t.id}`} className="flex items-center gap-3 rounded-block border border-line bg-white px-4 py-3 hover:border-action">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{t.subject}</span>
                    <span className="text-[13px] text-ink-muted">Cập nhật {formatRelative(t.updatedAt)}</span>
                  </span>
                  <Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge>
                  <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

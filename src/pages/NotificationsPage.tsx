import { Link } from 'react-router'
import type { Schemas } from '../api/client.ts'
import { useMarkNotificationRead, useNotifications } from '../hooks/account.ts'
import { formatRelative } from '../lib/format.ts'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'

/** Mở đối tượng luôn kiểm tra quyền lại ở trang đích (AC-033). */
function targetOf(n: Schemas['Notification']) {
  if (!n.objectId) return null
  if (n.objectType === 'DATE_PLAN') return `/plans/${n.objectId}`
  if (n.objectType === 'SUPPORT_TICKET') return `/account/support/${n.objectId}`
  return null
}

/** Link thật khi có đối tượng (mở tab mới được); không có đối tượng thì chỉ đánh dấu đã đọc. */
function NotificationRow({ to, onOpen, children }: { to: string | null; onOpen: () => void; children: React.ReactNode }) {
  const className = 'flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-page'
  return to ? (
    <Link to={to} onClick={onOpen} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={className}>
      {children}
    </button>
  )
}

/** S-17 Thông báo — FR-21. Trạng thái đọc là PROP (OQ-14). */
export function NotificationsPage() {
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold md:text-3xl">Thông báo</h1>
      <div className="mt-5">
        {notifications.isPending ? (
          <Skeleton className="h-40" />
        ) : notifications.isError ? (
          <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
        ) : notifications.data.items.length === 0 ? (
          <EmptyState title="Chưa có thông báo">Cập nhật về buổi hẹn và yêu cầu hỗ trợ sẽ hiện ở đây.</EmptyState>
        ) : (
          <ul className="overflow-hidden rounded-block border border-line bg-white">
            {notifications.data.items.map((n) => {
              const unread = !n.readAt
              const target = targetOf(n)
              return (
                <li key={n.id} className="border-b border-line last:border-0">
                  <NotificationRow to={target} onOpen={() => unread && markRead.mutate(n.id)}>
                    <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${unread ? 'bg-sky' : 'bg-transparent'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block ${unread ? 'font-semibold' : ''}`}>
                        {unread && <span className="sr-only">Chưa đọc: </span>}
                        {n.summary}
                      </span>
                      <span className="text-[13px] text-ink-muted">{formatRelative(n.createdAt)}</span>
                    </span>
                  </NotificationRow>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

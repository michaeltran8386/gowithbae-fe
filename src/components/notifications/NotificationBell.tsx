import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Bell, CalendarHeart, ChevronRight, Megaphone, MessageSquareHeart, X } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { useMarkNotificationRead, useNotifications } from '../../hooks/account.ts'
import { formatRelative } from '../../lib/format.ts'
import { ErrorState, Skeleton } from '../ui/StateView.tsx'

type FilterTab = 'all' | 'unread' | 'plan'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'plan', label: 'Buổi hẹn' },
]

function isPlanType(type: Schemas['Notification']['type']) {
  return type === 'DATE_PLAN_UPDATED' || type === 'DATE_PLAN_CANCELLED' || type === 'DATE_PLAN_INVITE_RESPONDED'
}

function filterItems(items: Schemas['Notification'][], tab: FilterTab) {
  if (tab === 'unread') return items.filter((n) => !n.readAt)
  if (tab === 'plan') return items.filter((n) => isPlanType(n.type))
  return items
}

function NotificationBadgeIcon({ type }: { type: Schemas['Notification']['type'] }) {
  if (isPlanType(type)) {
    return (
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
        <CalendarHeart size={16} />
      </span>
    )
  }
  if (type === 'ADMIN_ANNOUNCEMENT') {
    return (
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-peach-50 text-attention">
        <Megaphone size={16} />
      </span>
    )
  }
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-peach-50 text-attention">
      <MessageSquareHeart size={16} />
    </span>
  )
}

/**
 * Chuông thông báo ở góc trên phải header. Bấm để bật/tắt khung xem nhanh kiểu popover nhỏ;
 * người dùng có thể lọc và cuộn danh sách ngay trong khung, bấm vào thông báo hoặc khung sẽ mở /account/notifications.
 */
export function NotificationBell() {
  const notifications = useNotifications(true)
  const markRead = useMarkNotificationRead()
  const { pathname } = useLocation()
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const [tab, setTab] = useState<FilterTab>('all')
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)
  const isOpen = phase === 'open'
  const isMounted = phase !== 'closed'

  const items = notifications.data?.items ?? []
  const unread = notifications.data?.unreadCount ?? 0
  const visible = filterItems(items, tab)
  const activeRoute = pathname.startsWith('/account/notifications')

  const closeNow = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setPhase('closed')
  }, [])

  const close = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPhase('closed')
      return
    }
    setPhase((prev) => {
      if (prev === 'closed') return prev
      closeTimer.current = window.setTimeout(() => setPhase('closed'), 210)
      return 'closing'
    })
  }, [])

  const openPanel = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setPhase('open')
  }, [])

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        onClick={() => (isOpen ? close() : openPanel())}
        className={`relative inline-flex size-11 items-center justify-center rounded-full transition-transform duration-150 hover:bg-action-soft hover:text-action active:scale-90 ${
          isOpen || activeRoute ? 'bg-action-soft text-action' : 'text-ink-muted'
        }`}
      >
        <Bell size={22} aria-hidden="true" className={isOpen ? 'animate-bell-wiggle' : undefined} />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute top-1.5 right-1.5 min-w-5 rounded-full bg-attention px-1 text-center text-[11px] leading-5 font-bold text-white tabular">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isMounted && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Thông báo gần đây"
          style={{ transformOrigin: 'calc(100% - 22px) -10px' }}
          className={`absolute top-full right-0 z-50 mt-2 w-[300px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-white shadow-raised sm:w-[320px] ${
            phase === 'closing' ? 'pointer-events-none animate-bell-spring-out' : 'animate-bell-spring-in'
          }`}
        >
          {/* Mũi nhọn hướng thẳng về tâm icon chuông */}
          <span aria-hidden="true" className="absolute -top-[7px] right-[16px] size-3 rotate-45 border-t border-l border-line bg-white" />

          {/* Tiêu đề gọn */}
          <div className="relative flex items-center justify-between gap-2 rounded-t-2xl border-b border-line/70 bg-white px-3.5 py-2.5">
            <Link to="/account/notifications" onClick={closeNow} className="flex items-center gap-2 rounded-md transition-colors hover:text-action">
              <span className="text-sm font-bold text-ink">Thông báo</span>
              {unread > 0 && (
                <span className="rounded-full bg-action px-1.5 py-0.5 text-[11px] leading-none font-bold text-white tabular">{unread}</span>
              )}
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Đóng thông báo"
              className="inline-flex size-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-page hover:text-ink"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Thanh lọc nhanh */}
          <div role="tablist" aria-label="Lọc thông báo" className="grid grid-cols-3 gap-1 bg-page/70 p-1.5">
            {TABS.map((t) => {
              const selected = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                    selected ? 'bg-white text-action shadow-2xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Danh sách thông báo cuộn được ngay trong khung nhỏ */}
          <div className="max-h-60 overflow-y-auto overscroll-contain">
            {notifications.isPending ? (
              <div className="flex flex-col gap-2 p-3" aria-hidden="true">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : notifications.isError ? (
              <div className="p-2.5">
                <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
              </div>
            ) : visible.length === 0 ? (
              <Link
                to="/account/notifications"
                onClick={closeNow}
                className="m-2.5 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-page/60 px-4 py-6 text-center transition-colors hover:border-action/50 hover:bg-action-soft/40"
              >
                <span aria-hidden="true" className="mb-2 flex size-9 items-center justify-center rounded-full bg-white text-action shadow-2xs">
                  <Bell size={18} />
                </span>
                <span className="text-sm font-semibold text-ink">
                  {tab === 'unread' ? 'Không có thông báo chưa đọc' : tab === 'plan' ? 'Chưa có thông báo buổi hẹn' : 'Chưa có thông báo'}
                </span>
                <span className="mt-1 text-xs font-medium text-action">Bấm để mở trang thông báo →</span>
              </Link>
            ) : (
              <ul className="divide-y divide-line/70">
                {visible.map((n) => {
                  const isUnread = !n.readAt
                  return (
                    <li key={n.id}>
                      <Link
                        to="/account/notifications"
                        onClick={() => {
                          if (isUnread) markRead.mutate(n.id)
                          closeNow()
                        }}
                        className="group flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-page/80"
                      >
                        <span aria-hidden="true" className={`mt-3 size-1.5 shrink-0 rounded-full ${isUnread ? 'bg-sky' : 'bg-transparent'}`} />
                        <NotificationBadgeIcon type={n.type} />
                        <span className="min-w-0 flex-1">
                          <span className={`block line-clamp-2 text-[13px] leading-snug text-ink ${isUnread ? 'font-semibold' : ''}`}>
                            {isUnread && <span className="sr-only">Chưa đọc: </span>}
                            {n.summary}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ink-muted">{formatRelative(n.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Chân khung dẫn tới trang Thông báo đầy đủ */}
          <Link
            to="/account/notifications"
            onClick={closeNow}
            className="flex items-center justify-between rounded-b-2xl border-t border-line bg-page/55 px-3.5 py-2 text-xs transition-colors hover:bg-action-soft/60"
          >
            <span className="text-ink-muted tabular">{items.length} tổng cộng</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-action">
              Xem chi tiết
              <ChevronRight size={14} aria-hidden="true" />
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}

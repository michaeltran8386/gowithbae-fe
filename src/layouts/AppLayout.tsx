import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Bell, CalendarHeart, Compass, Heart as HeartIcon, UserRound } from 'lucide-react'
import { useAuth } from '../app/auth.tsx'
import { useNotifications } from '../hooks/account.ts'
import { CompareTray } from '../components/place/Compare.tsx'
import { Logo } from '../components/ui/Logo.tsx'
import { MockDataBanner } from './MockDataBanner.tsx'

// Điều hướng chính SRS §8: Khám phá, Đã lưu, Buổi hẹn, Tài khoản.
const NAV = [
  { to: '/', label: 'Khám phá', icon: Compass, end: true },
  { to: '/saved', label: 'Đã lưu', icon: HeartIcon },
  { to: '/plans', label: 'Buổi hẹn', icon: CalendarHeart },
  { to: '/account', label: 'Tài khoản', icon: UserRound },
]

/** Trang có action bar đáy riêng thì ẩn bottom nav trên mobile. */
const ACTION_BAR_ROUTES = [/^\/places\/[^/]+$/, /^\/choice\/(?!new$)[^/]+$/]

export function AppLayout() {
  const { state } = useAuth()
  const { pathname } = useLocation()
  const member = state.status === 'member'
  const notifications = useNotifications(member)
  const unread = notifications.data?.unreadCount ?? 0
  const hideBottomNav = ACTION_BAR_ROUTES.some((r) => r.test(pathname))

  return (
    <div className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      <a href="#main" className="sr-only z-50 rounded-control bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua đến nội dung chính
      </a>
      <MockDataBanner />
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
          <Logo />
          <nav aria-label="Điều hướng chính" className="hidden flex-1 gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-control px-3 py-2 text-[15px] whitespace-nowrap ${isActive ? 'bg-action-soft font-semibold text-action' : 'text-ink-muted hover:text-ink'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {member ? (
              <Link
                to="/account/notifications"
                className="relative inline-flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-action-soft hover:text-action"
                aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
              >
                <Bell size={22} aria-hidden="true" />
                {unread > 0 && (
                  <span aria-hidden="true" className="absolute top-1.5 right-1.5 min-w-5 rounded-full bg-attention px-1 text-center text-[11px] leading-5 font-bold text-white tabular">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            ) : (
              state.status === 'anonymous' && (
                <Link to={`/login?returnTo=${encodeURIComponent(pathname)}`} className="rounded-control px-3 py-2 text-sm font-semibold text-action hover:bg-action-soft">
                  Đăng nhập
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
        <Outlet />
      </main>

      <CompareTray />

      <footer className="mx-auto hidden max-w-6xl px-6 py-10 text-[13px] text-ink-muted md:block">
        <span translate="no">GoWithBae</span> · Thông tin địa điểm được đội ngũ kiểm tra; giá và giờ có thể thay đổi, hãy kiểm tra trước khi đi.
      </footer>

      {!hideBottomNav && (
        <nav
          aria-label="Thanh điều hướng"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] ${isActive ? 'font-semibold text-action' : 'text-ink-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

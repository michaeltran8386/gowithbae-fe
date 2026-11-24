import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Bell, CalendarHeart, Compass, Megaphone, UserRound } from 'lucide-react'
import { useAuth } from '../app/auth.tsx'
import { useNotifications } from '../hooks/account.ts'
import { useSiteContent } from '../hooks/adminSupport.ts'
import { useSavedLists } from '../hooks/saved.ts'
import { CompareTray } from '../components/place/Compare.tsx'
import { CartIcon } from '../components/cart/CartIcons.tsx'
import { ListDock } from '../components/cart/ListDock.tsx'
import { Logo } from '../components/ui/Logo.tsx'
import { MockDataBanner } from './MockDataBanner.tsx'

// Điều hướng chính (CR-002): tab Đã lưu thay bằng icon giỏ hẹn ở header.
const NAV = [
  { to: '/', label: 'Khám phá', icon: Compass, end: true },
  { to: '/plans', label: 'Buổi hẹn', icon: CalendarHeart },
  { to: '/account', label: 'Tài khoản', icon: UserRound },
]

const FOOTER_LINKS = [
  { to: '/faq', label: 'Câu hỏi thường gặp' },
  { to: '/terms', label: 'Điều khoản' },
  { to: '/privacy', label: 'Quyền riêng tư' },
  { to: '/contact', label: 'Liên hệ' },
]

/** Trang có action bar đáy riêng thì ẩn bottom nav trên mobile. */
const ACTION_BAR_ROUTES = [/^\/places\/[^/]+$/, /^\/choice\/(?!new$)[^/]+$/]

/** Trang lướt địa điểm: hiện icon list nổi bên phải (đích của nút +). */
const BROWSE_ROUTES = [/^\/$/, /^\/search$/, /^\/collections\/[^/]+$/, /^\/places\/[^/]+$/]

export function AppLayout() {
  const { state } = useAuth()
  const { pathname } = useLocation()
  const member = state.status === 'member'
  const notifications = useNotifications(member)
  const unread = notifications.data?.unreadCount ?? 0
  const hideBottomNav = ACTION_BAR_ROUTES.some((r) => r.test(pathname))
  const showDock = member && BROWSE_ROUTES.some((r) => r.test(pathname))
  const site = useSiteContent().data

  return (
    <div className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      <a href="#main" className="sr-only z-50 rounded-control bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua đến nội dung chính
      </a>
      <MockDataBanner />
      {site?.homeBanner.enabled && site.homeBanner.text && <SiteBanner text={site.homeBanner.text} linkUrl={site.homeBanner.linkUrl} />}
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
            {member && <CartLink />}
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
      {showDock && <ListDock />}

      <footer className="mx-auto max-w-6xl px-4 py-8 text-[13px] text-ink-muted md:px-6 md:py-10">
        <nav aria-label="Thông tin" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>{site?.footer.text || 'Thông tin địa điểm được đội ngũ kiểm tra; giá và giờ có thể thay đổi, hãy kiểm tra trước khi đi.'}</p>
      </footer>

      {!hideBottomNav && (
        <nav
          aria-label="Thanh điều hướng"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
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

/** Icon giỏ hẹn kiểu Shopee (CR-002): badge = tổng số nơi trong mọi danh sách, bấm vào trang giỏ. */
function CartLink() {
  const lists = useSavedLists()
  const total = lists.data?.reduce((sum, l) => sum + l.placeCount, 0) ?? 0
  return (
    <NavLink
      to="/saved"
      aria-label={total > 0 ? `Giỏ hẹn, ${total} địa điểm` : 'Giỏ hẹn'}
      className={({ isActive }) =>
        `relative inline-flex size-11 items-center justify-center rounded-full hover:bg-action-soft hover:text-action ${isActive ? 'bg-action-soft text-action' : 'text-ink-muted'}`
      }
    >
      <CartIcon size={24} />
      {total > 0 && (
        <span aria-hidden="true" className="absolute top-1 right-0.5 min-w-5 rounded-full bg-attention px-1 text-center text-[11px] leading-5 font-bold text-white tabular">
          {total > 99 ? '99+' : total}
        </span>
      )}
    </NavLink>
  )
}

/** Banner do quản trị viên bật trong "Nội dung web". Link ngoài mở tab mới; link nội bộ đi bằng router. */
function SiteBanner({ text, linkUrl }: { text: string; linkUrl?: string | null }) {
  const body = (
    <>
      <Megaphone size={16} className="shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </>
  )
  const cls = 'mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm md:px-6'
  return (
    <div role="region" aria-label="Thông báo" className="bg-peach-50 text-ink">
      {linkUrl?.startsWith('/') ? (
        <Link to={linkUrl} className={`${cls} hover:underline`}>
          {body}
        </Link>
      ) : linkUrl && /^https?:\/\//.test(linkUrl) ? (
        <a href={linkUrl} target="_blank" rel="noreferrer" className={`${cls} hover:underline`}>
          {body}
        </a>
      ) : (
        <p className={cls}>{body}</p>
      )}
    </div>
  )
}

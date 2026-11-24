import { NavLink, Navigate, Outlet, useLocation } from 'react-router'
import {
  BarChart3,
  Bell,
  FileText,
  FolderTree,
  History,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageSquareWarning,
  Upload,
  Users,
} from 'lucide-react'
import { loginHref, useAuth } from '../app/auth.tsx'
import { EmptyState, LoadingState } from '../components/ui/StateView.tsx'
import { ButtonLink } from '../components/ui/Button.tsx'

type NavItem = { to: string; label: string; icon: typeof Users; end?: boolean }

const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Tổng quan', items: [{ to: '/admin', label: 'Bảng điều khiển', icon: BarChart3, end: true }] },
  { group: 'Người dùng', items: [{ to: '/admin/users', label: 'Tài khoản', icon: Users }] },
  {
    group: 'Địa điểm',
    items: [
      { to: '/admin/places', label: 'Địa điểm', icon: MapPin },
      { to: '/admin/imports', label: 'Nhập CSV', icon: Upload },
      { to: '/admin/taxonomies', label: 'Nhãn & khu vực', icon: FolderTree },
      { to: '/admin/collections', label: 'Bộ sưu tập', icon: LayoutGrid },
    ],
  },
  {
    group: 'Nội dung web',
    items: [
      { to: '/admin/content', label: 'Trang tĩnh', icon: FileText },
      { to: '/admin/notifications', label: 'Gửi thông báo', icon: Bell },
    ],
  },
  {
    group: 'Hỗ trợ',
    items: [
      { to: '/admin/place-reports', label: 'Báo sai', icon: MessageSquareWarning },
      { to: '/admin/tickets', label: 'Yêu cầu hỗ trợ', icon: LifeBuoy },
    ],
  },
  { group: 'Hệ thống', items: [{ to: '/admin/audit', label: 'Nhật ký', icon: History }] },
]

/** Khung quản trị: chỉ quản trị viên (SUPER_ADMIN). Ẩn với người khác chỉ là UX — quyền thật ở server. */
export function AdminLayout() {
  const { state, meta, actions } = useAuth()
  const location = useLocation()
  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'anonymous') return <Navigate to={`${loginHref(location.pathname + location.search)}&staff=1`} replace />
  if (!meta.isAdmin)
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState title="Không tìm thấy trang" action={<ButtonLink to="/">Về Khám phá</ButtonLink>} />
      </div>
    )
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <nav className="border-b border-line bg-white md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0" aria-label="Quản trị">
        <div className="flex items-center justify-between px-4 py-4">
          <a href="/" className="font-bold text-action">
            GoWithBae Admin
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto px-3 pb-3 md:flex-col md:gap-3 md:overflow-visible">
          {NAV.map((g) => (
            <div key={g.group} className="shrink-0">
              <p className="mb-1 hidden px-3 text-[12px] font-semibold tracking-wide text-ink-muted uppercase md:block">{g.group}</p>
              <ul className="flex gap-1 md:flex-col">
                {g.items.map((n) => (
                  <li key={n.to}>
                    <NavLink
                      to={n.to}
                      end={n.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-control px-3 py-2 text-sm whitespace-nowrap ${isActive ? 'bg-action-soft font-semibold text-action' : 'text-ink-muted hover:bg-page hover:text-ink'}`
                      }
                    >
                      <n.icon size={16} aria-hidden="true" />
                      {n.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hidden border-t border-line px-4 py-3 text-[13px] md:block">
          <p className="truncate text-ink-muted" title={state.user?.email}>
            {state.user?.email}
          </p>
          <button
            type="button"
            onClick={() => actions.signOut()}
            className="mt-2 flex items-center gap-2 text-ink-muted hover:text-ink"
          >
            <LogOut size={14} aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      </nav>
      <main id="main" className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

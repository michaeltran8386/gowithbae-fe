import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../app/auth.tsx'
import { EmptyState, LoadingState } from '../components/ui/StateView.tsx'
import { ButtonLink } from '../components/ui/Button.tsx'

const NAV = [
  { to: '/admin', label: 'Hàng chờ duyệt', end: true },
  { to: '/admin/taxonomies', label: 'Danh mục' },
  { to: '/admin/collections', label: 'Bộ sưu tập' },
  { to: '/admin/users', label: 'Tài khoản' },
  { to: '/admin/tickets', label: 'Báo sai & hỗ trợ' },
  { to: '/admin/imports', label: 'Nhập CSV' },
  { to: '/admin/reports', label: 'Báo cáo' },
  { to: '/admin/audit', label: 'Nhật ký' },
]

/** Quản trị (F2, chưa lên lịch). Ẩn với người không có vai trò nhân sự — chỉ là UX, quyền thật ở server. */
export function AdminLayout() {
  const { state, meta } = useAuth()
  if (state.status === 'loading') return <LoadingState />
  if (!meta.isStaff)
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState title="Không tìm thấy trang" action={<ButtonLink to="/">Về Khám phá</ButtonLink>} />
      </div>
    )
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <nav className="border-b border-line bg-white p-4 md:w-56 md:border-r md:border-b-0" aria-label="Quản trị">
        <p className="mb-3 font-bold text-action">GoWithBae Admin</p>
        <ul className="flex flex-wrap gap-2 md:flex-col">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `block rounded-control px-3 py-2 text-sm ${isActive ? 'bg-action-soft font-semibold text-action' : 'text-ink-muted hover:bg-page'}`
                }
              >
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main" className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

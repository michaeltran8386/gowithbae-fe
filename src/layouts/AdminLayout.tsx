import { NavLink, Outlet } from 'react-router'

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

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <nav className="border-b border-surface-container bg-white p-4 md:w-56 md:border-r md:border-b-0" aria-label="Quản trị">
        <p className="mb-3 font-bold text-primary">GoWithBae Admin</p>
        <ul className="flex flex-wrap gap-2 md:flex-col">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-surface-container font-semibold text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`
                }
              >
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

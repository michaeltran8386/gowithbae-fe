import { Link, NavLink, Outlet } from 'react-router'

// Điều hướng chính §8: Khám phá, Đã lưu, Buổi hẹn, Tài khoản.
const NAV = [
  { to: '/', label: 'Khám phá', end: true },
  { to: '/saved', label: 'Đã lưu' },
  { to: '/plans', label: 'Buổi hẹn' },
  { to: '/account', label: 'Tài khoản' },
]

export function AppLayout() {
  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-surface-container bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-bold text-primary">
            GoWithBae
          </Link>
          <nav className="hidden gap-6 md:flex" aria-label="Điều hướng chính">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-primary' : 'text-on-surface-variant hover:text-primary'
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t border-surface-container bg-white md:hidden"
        aria-label="Điều hướng chính"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `py-3 text-center text-sm ${isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'}`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

import { Outlet } from 'react-router'
import { Logo } from '../components/ui/Logo.tsx'
import { MockDataBanner } from './MockDataBanner.tsx'

/** Đăng nhập và link mời: không có điều hướng chính, tập trung vào một việc (UX-02). */
export function MinimalLayout() {
  return (
    <div className="min-h-dvh">
      <MockDataBanner />
      <header className="mx-auto flex h-16 max-w-xl items-center px-4">
        <Logo />
      </header>
      <main id="main" className="mx-auto max-w-xl px-4 pt-2 pb-12">
        <Outlet />
      </main>
    </div>
  )
}

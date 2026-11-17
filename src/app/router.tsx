import { Outlet, createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from '../layouts/AppLayout.tsx'
import { AdminLayout } from '../layouts/AdminLayout.tsx'
import { MinimalLayout } from '../layouts/MinimalLayout.tsx'
import { RouteErrorPage } from '../pages/RouteErrorPage.tsx'
import { RequireAuth } from './auth.tsx'

/** Mỗi màn một chunk (bundle-*): chỉ tải code của màn đang mở. */
type PageModule = Record<string, unknown>
const page =
  <M extends PageModule>(load: () => Promise<M>, name: keyof M & string): RouteObject['lazy'] =>
  async () => ({ Component: (await load())[name] as React.ComponentType })

function Protected() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  )
}

// Mã màn theo docs/frontend/02-screen-inventory.md (S-xx) và FR của SRS v1.1.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, lazy: page(() => import('../pages/DiscoverPage.tsx'), 'DiscoverPage') }, // S-01 FR-01, FR-18
      { path: 'search', lazy: page(() => import('../pages/SearchPage.tsx'), 'SearchPage') }, // S-03 FR-02..04
      { path: 'collections/:collectionId', lazy: page(() => import('../pages/CollectionPage.tsx'), 'CollectionPage') }, // S-02
      { path: 'places/:placeId', lazy: page(() => import('../pages/PlaceDetailPage.tsx'), 'PlaceDetailPage') }, // S-04 FR-05
      { path: 'compare', lazy: page(() => import('../pages/ComparePage.tsx'), 'ComparePage') }, // S-05 FR-06
      // Người nhận link xem bằng phiên khách — không qua RequireAuth (CR-001)
      { path: 'choice/:sessionId', lazy: page(() => import('../pages/ChoiceVotePage.tsx'), 'ChoiceVotePage') }, // S-11 FR-12/14
      { path: 'choice/:sessionId/results', lazy: page(() => import('../pages/ChoiceResultsPage.tsx'), 'ChoiceResultsPage') }, // S-12 FR-13
      { path: 'plans/:planId', lazy: page(() => import('../pages/PlanDetailPage.tsx'), 'PlanDetailPage') }, // S-15 FR-16..18
      {
        element: <Protected />,
        children: [
          { path: 'saved', lazy: page(() => import('../pages/SavedListsPage.tsx'), 'SavedListsPage') }, // S-07 FR-09
          { path: 'saved/:listId', lazy: page(() => import('../pages/SavedListPage.tsx'), 'SavedListPage') }, // S-08
          { path: 'choice/new', lazy: page(() => import('../pages/CreateInvitePage.tsx'), 'CreateInvitePage') }, // S-09 FR-10
          { path: 'plans', lazy: page(() => import('../pages/PlansPage.tsx'), 'PlansPage') }, // S-13
          { path: 'plans/new', lazy: page(() => import('../pages/PlanNewPage.tsx'), 'PlanNewPage') }, // S-14 FR-15
          { path: 'plans/:planId/edit', lazy: page(() => import('../pages/PlanEditPage.tsx'), 'PlanEditPage') }, // S-15 sửa
          { path: 'account', lazy: page(() => import('../pages/AccountPage.tsx'), 'AccountPage') }, // S-16 FR-08
          { path: 'account/notifications', lazy: page(() => import('../pages/NotificationsPage.tsx'), 'NotificationsPage') }, // S-17
          { path: 'account/support', lazy: page(() => import('../pages/SupportListPage.tsx'), 'SupportListPage') }, // S-18
          { path: 'account/support/new', lazy: page(() => import('../pages/SupportNewPage.tsx'), 'SupportNewPage') }, // S-19
          { path: 'account/support/:ticketId', lazy: page(() => import('../pages/SupportDetailPage.tsx'), 'SupportDetailPage') }, // S-20
        ],
      },
      { path: '*', lazy: page(() => import('../pages/NotFoundPage.tsx'), 'NotFoundPage') }, // S-21
    ],
  },
  {
    element: <MinimalLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: 'login', lazy: page(() => import('../pages/LoginPage.tsx'), 'LoginPage') }, // S-06 FR-07
      { path: 'invite/:inviteToken', lazy: page(() => import('../pages/InvitePage.tsx'), 'InvitePage') }, // S-10 FR-11
    ],
  },
  {
    // F2 — chưa lên lịch (chờ OQ-15/18/19/20)
    path: 'admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [{ path: '*?', lazy: page(() => import('../pages/admin/AdminPendingPage.tsx'), 'AdminPendingPage') }],
  },
]

export const createRouter = () => createBrowserRouter(routes)

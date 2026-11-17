import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { session } from '../api/client.ts'
import { Providers, createQueryClient } from '../app/providers.tsx'
import { routes } from '../app/router.tsx'
import { MOCK_TOKEN } from '../mocks/data.ts'

/** Render ứng dụng thật (router + providers) tại một đường dẫn, dữ liệu qua MSW. */
export function renderApp(path: string, { member = false }: { member?: boolean } = {}) {
  if (member) session.setAccessToken(MOCK_TOKEN)
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  const utils = render(
    <Providers client={createQueryClient()}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { ...utils, user, router }
}

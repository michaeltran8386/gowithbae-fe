import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { Providers, createQueryClient } from './app/providers.tsx'
import { createRouter } from './app/router.tsx'

/** Dữ liệu minh họa chỉ bật bằng `npm run dev:mock` (VITE_API_MOCK=1); không có trong bản build thật. */
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCK !== '1') return
  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers client={createQueryClient()}>
        <RouterProvider router={createRouter()} />
      </Providers>
    </StrictMode>,
  )
})

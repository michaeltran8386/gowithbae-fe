import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ApiError } from '../api/problem.ts'
import { AuthProvider } from './auth.tsx'
import { CompareProvider } from './compare.tsx'
import { ToastProvider } from '../components/ui/Toast.tsx'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // GET: thử lại tối đa 2 lần, không thử lại lỗi 4xx (02-api-integration-plan §1)
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}

export function Providers({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <CompareProvider>
          <ToastProvider>{children}</ToastProvider>
        </CompareProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

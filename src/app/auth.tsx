import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router'
import { api, session, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import { LoadingState } from '../components/ui/StateView.tsx'

type AuthContextValue = {
  state: { status: 'loading' | 'anonymous' | 'member'; user: Schemas['User'] | null }
  actions: { signIn: (token: Schemas['AuthToken']) => void; signOut: () => Promise<void> }
  meta: { isStaff: boolean }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const meQueryKey = ['me'] as const

/** Provider là nơi duy nhất biết token lưu ở đâu (state-decouple-implementation). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => !!session.getAccessToken())

  const clearSession = useCallback(() => {
    session.setAccessToken(null)
    setHasToken(false)
    queryClient.clear() // máy dùng chung: không giữ dữ liệu người trước
  }, [queryClient])

  useEffect(() => {
    session.setUnauthorizedHandler(clearSession)
    return () => session.setUnauthorizedHandler(null)
  }, [clearSession])

  const me = useQuery({
    queryKey: meQueryKey,
    queryFn: () => unwrap(api.GET('/me')),
    enabled: hasToken,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })

  const value = useMemo<AuthContextValue>(() => {
    const user = hasToken ? (me.data ?? null) : null
    const status = !hasToken ? 'anonymous' : me.isPending ? 'loading' : user ? 'member' : 'anonymous'
    return {
      state: { status, user },
      actions: {
        signIn: (token) => {
          session.setAccessToken(token.accessToken)
          queryClient.setQueryData(meQueryKey, token.user)
          setHasToken(true)
        },
        signOut: async () => {
          await api.POST('/auth/logout').catch(() => undefined)
          clearSession()
        },
      },
      meta: { isStaff: !!user?.roles.some((r) => r !== 'MEMBER') },
    }
  }, [hasToken, me.data, me.isPending, queryClient, clearSession])

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider')
  return ctx
}

/** URL đăng nhập giữ chỗ quay lại + thao tác dở (A-11, UX-06). */
export function loginHref(returnTo: string, intent?: string) {
  const params = new URLSearchParams({ returnTo })
  if (intent) params.set('intent', intent)
  return `/login?${params}`
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()
  if (state.status === 'loading') return <LoadingState label="Đang kiểm tra đăng nhập…" />
  if (state.status === 'anonymous') return <Navigate to={loginHref(location.pathname + location.search)} replace />
  return children
}
